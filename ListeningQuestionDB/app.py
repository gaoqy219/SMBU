import os
import sqlite3
import uuid
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, send_file, jsonify
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# 获取app.py所在目录的绝对路径（核心修改）
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 初始化Flask应用
app = Flask(__name__)
app.secret_key = 'hsk_listening_2025'

# 基于BASE_DIR构建所有路径（确保在app.py同目录）
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static/audio')
app.config['GENERATED_FOLDER'] = os.path.join(BASE_DIR, 'static/generated')
app.config['ORDER_FILES_FOLDER'] = os.path.join(BASE_DIR, 'static/ordersfile')
app.config['DATABASE_PATH'] = os.path.join(BASE_DIR, 'database.db')  # 数据库文件路径
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {'mp3'}

# 确保所有目录存在（基于BASE_DIR）
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)
os.makedirs(app.config['ORDER_FILES_FOLDER'], exist_ok=True)

# 初始化数据库（绑定到app.py同目录的database.db）
def init_db():
    # 连接BASE_DIR下的database.db
    conn = sqlite3.connect(app.config['DATABASE_PATH'])
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS listening_questions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  audio_path TEXT NOT NULL,
                  question_text TEXT NOT NULL,
                  answer TEXT NOT NULL,
                  level TEXT NOT NULL,
                  source TEXT NOT NULL,
                  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

# 检查文件扩展名
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 数据库连接（使用BASE_DIR下的database.db）
def get_db_connection():
    conn = sqlite3.connect(app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    return conn

# 原有上传路由（路径已绑定BASE_DIR，无需其他修改）
@app.route('/', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        if 'audio' not in request.files:
            flash('未选择音频文件')
            return redirect(request.url)
        file = request.files['audio']
        
        question_text = request.form.get('question_text', '').strip()
        answer = request.form.get('answer', '').strip()
        level = request.form.get('level', '').strip()
        source = request.form.get('source', '').strip()

        if not all([question_text, answer, level, source]):
            flash('题目文字、答案、等级、出处均为必填项')
            return redirect(request.url)
        
        if file.filename == '':
            flash('未选择音频文件')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            import time
            filename = secure_filename(file.filename)
            filename = f"{int(time.time())}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            conn = get_db_connection()
            conn.execute('INSERT INTO listening_questions (audio_path, question_text, answer, level, source) VALUES (?, ?, ?, ?, ?)',
                         (filename, question_text, answer, level, source))
            conn.commit()
            conn.close()

            flash('题目上传成功！')
            return redirect(url_for('upload'))
        else:
            flash('仅支持上传MP3格式音频')
            return redirect(request.url)
    
    return render_template('upload.html')

# 原有查看路由（无需修改）
@app.route('/view', methods=['GET'])
def view():
    level = request.args.get('level', '')
    source = request.args.get('source', '')

    query = 'SELECT * FROM listening_questions WHERE 1=1'
    params = []
    if level:
        query += ' AND level = ?'
        params.append(level)
    if source:
        query += ' AND source = ?'
        params.append(source)
    query += ' ORDER BY upload_time DESC'

    conn = get_db_connection()
    questions = conn.execute(query, params).fetchall()
    conn.close()

    level_options = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'HSK7-9']
    source_options = ['真题', '模拟题', '自拟题']

    return render_template('view.html', 
                           questions=questions,
                           level_options=level_options,
                           source_options=source_options,
                           selected_level=level,
                           selected_source=source)

# 生成试题页面路由（无需修改）
@app.route('/generate', methods=['GET'])
def generate():
    question_ids = request.args.getlist('question_ids')
    if not question_ids:
        flash('请至少选择一道试题！')
        return redirect(url_for('view'))
    
    placeholders = ', '.join(['?'] * len(question_ids))
    conn = get_db_connection()
    questions = conn.execute(f'SELECT * FROM listening_questions WHERE id IN ({placeholders})', question_ids).fetchall()
    conn.close()

    duration_options = [5, 10, 15, 20, 25, 30]
    
    return render_template('generate.html', 
                           questions=questions,
                           duration_options=duration_options)

# 音频拼接生成路由（路径已绑定BASE_DIR，无需修改）
@app.route('/generate_audio', methods=['POST'])
def generate_audio():
    try:
        data = request.json
        question_order = data.get('question_order', [])
        durations = data.get('durations', {})

        if not question_order:
            return jsonify({'success': False, 'message': '请选择试题并调整顺序'})
        
        combined = AudioSegment.empty()
        missing_files = []  # 记录缺失的提示音文件
        
        for idx, q_id in enumerate(question_order, 1):
            # 加载序号提示音
            order_filename = f"{idx:02d}.mp3"
            order_audio_path = os.path.join(app.config['ORDER_FILES_FOLDER'], order_filename)
            
            if os.path.exists(order_audio_path):
                order_audio = AudioSegment.from_mp3(order_audio_path)
                combined += order_audio
            else:
                missing_files.append(order_filename)
            
            # 加载试题音频
            conn = get_db_connection()
            question = conn.execute('SELECT audio_path FROM listening_questions WHERE id = ?', (q_id,)).fetchone()
            conn.close()
            
            if not question:
                continue
            
            audio_path = os.path.join(app.config['UPLOAD_FOLDER'], question['audio_path'])
            audio = AudioSegment.from_mp3(audio_path)
            combined += audio
            
            # 生成静音段
            duration = int(durations.get(str(q_id), 5))
            silence = AudioSegment.silent(duration=duration * 1000)
            combined += silence
        
        # 拼接结尾结束音
        over_audio_path = os.path.join(app.config['ORDER_FILES_FOLDER'], 'over.mp3')
        if os.path.exists(over_audio_path):
            over_audio = AudioSegment.from_mp3(over_audio_path)
            combined += over_audio
        else:
            missing_files.append('over.mp3')
        
        # 生成唯一文件名（保存到GENERATED_FOLDER）
        filename = f"combined_{uuid.uuid4()}.mp3"
        output_path = os.path.join(app.config['GENERATED_FOLDER'], filename)
        combined.export(output_path, format="mp3")
        
        # 返回结果（含缺失文件提示）
        response = {'success': True, 'filename': filename}
        if missing_files:
            response['message'] = f'音频生成成功，但缺失以下提示音文件：{", ".join(missing_files)}'
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'生成失败：{str(e)}'})

# 下载生成的音频（无需修改）
@app.route('/download/<filename>')
def download_audio(filename):
    return send_from_directory(app.config['GENERATED_FOLDER'], filename, as_attachment=True)

# 音频文件访问路由（无需修改）
@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
