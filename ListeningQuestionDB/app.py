import os
import sqlite3
import uuid
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, send_file, jsonify
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# 初始化Flask应用
app = Flask(__name__)
app.secret_key = 'hsk_listening_2025'
app.config['UPLOAD_FOLDER'] = 'static/audio'
app.config['GENERATED_FOLDER'] = 'static/generated'  # 存储生成的音频
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {'mp3'}

# 确保目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)

# 初始化数据库
def init_db():
    conn = sqlite3.connect('database.db')
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

# 数据库连接
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# 原有上传路由（不变）
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

# 原有查看路由（修改：支持选中试题）
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

# 新增：生成试题页面路由
@app.route('/generate', methods=['GET'])
def generate():
    # 获取选中的试题ID列表
    question_ids = request.args.getlist('question_ids')
    if not question_ids:
        flash('请至少选择一道试题！')
        return redirect(url_for('view'))
    
    # 查询选中的试题
    placeholders = ', '.join(['?'] * len(question_ids))
    conn = get_db_connection()
    questions = conn.execute(f'SELECT * FROM listening_questions WHERE id IN ({placeholders})', question_ids).fetchall()
    conn.close()

    # 时长选项
    duration_options = [5, 10, 15, 20, 25, 30]
    
    return render_template('generate.html', 
                           questions=questions,
                           duration_options=duration_options)

# 新增：音频拼接生成路由
@app.route('/generate_audio', methods=['POST'])
def generate_audio():
    try:
        # 获取前端提交的试题顺序和时长
        data = request.json
        question_order = data.get('question_order', [])
        durations = data.get('durations', {})

        if not question_order:
            return jsonify({'success': False, 'message': '请选择试题并调整顺序'})
        
        # 拼接音频
        combined = AudioSegment.empty()
        
        for q_id in question_order:
            # 获取试题音频
            conn = get_db_connection()
            question = conn.execute('SELECT audio_path FROM listening_questions WHERE id = ?', (q_id,)).fetchone()
            conn.close()
            
            if not question:
                continue
            
            # 加载试题音频
            audio_path = os.path.join(app.config['UPLOAD_FOLDER'], question['audio_path'])
            audio = AudioSegment.from_mp3(audio_path)
            combined += audio
            
            # 添加空白音（静音）
            duration = int(durations.get(str(q_id), 5))  # 默认5秒
            silence = AudioSegment.silent(duration=duration * 1000)  # 转换为毫秒
            combined += silence
        
        # 生成唯一文件名
        filename = f"combined_{uuid.uuid4()}.mp3"
        output_path = os.path.join(app.config['GENERATED_FOLDER'], filename)
        
        # 导出拼接后的音频
        combined.export(output_path, format="mp3")
        
        return jsonify({'success': True, 'filename': filename})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'生成失败：{str(e)}'})

# 新增：下载生成的音频
@app.route('/download/<filename>')
def download_audio(filename):
    return send_from_directory(app.config['GENERATED_FOLDER'], filename, as_attachment=True)

# 原有音频访问路由（不变）
@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)  # 用5001端口避免冲突