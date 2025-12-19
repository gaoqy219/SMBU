HSK 听力题库系统 - 使用说明

项目简介本系统是本地部署的 HSK 听力题管理工具，支持听力题上传、检索、顺序调整及音频拼接生成，所有数据和文件均存储在本地，无需联网。
环境配置（分系统）通用前置要求：所有系统均需先安装 Python 3.7+（推荐 3.9/3.10 版本），可从官网下载：https://www.python.org/downloads/

Mac 系统环境配置
步骤 1：安装 Python 依赖包
打开「终端」，执行以下命令：
pip3 install flask werkzeug pydub
若 pip3 命令无效，尝试用 pip（根据 Python 安装方式调整）：
pip install flask werkzeug pydub
步骤 2：安装 ffmpeg（pydub 依赖，用于音频处理）需先安装 Homebrew（若未安装）：/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"然后安装 ffmpeg：brew install ffmpeg
验证安装：终端执行 ffmpeg -version，若显示版本信息则安装成功。

Linux 系统环境配置（以 Ubuntu/Debian 为例）
步骤 1：安装 Python 依赖包
打开「终端」，执行以下命令：
更新包管理器（可选）：
sudo apt update
安装 pip（若未安装）：
sudo apt install python3-pip
安装 Flask、Werkzeug、pydub：
pip3 install flask werkzeug pydub
步骤 2：安装 ffmpegsudo apt install ffmpeg
验证安装：终端执行 ffmpeg -version，显示版本信息即成功。

Windows 系统环境配置
步骤 1：安装 Python 依赖包
打开「命令提示符 (CMD)」或「PowerShell」，执行以下命令：
pip install flask werkzeug pydub
步骤 2：安装 ffmpeg（关键！）
下载 ffmpeg 安装包：https://ffmpeg.org/download.html#build-windows
选择「Windows builds by BtbN」或「Windows builds by gyan.dev」版本，下载 zip 包
解压 zip 包到任意目录（如 C:\ffmpeg）
配置环境变量：
右键「此电脑」→「属性」→「高级系统设置」→「环境变量」
在「系统变量」的「Path」中添加 ffmpeg 的 bin 目录（如 C:\ffmpeg\bin）
验证：重启 CMD/PowerShell，执行 ffmpeg -version，显示版本信息即成功。

运行步骤
步骤 1：放置项目文件将所有项目文件（app.py、templates 文件夹、static 文件夹）放在同一目录下，目录结构如下：
HSK 听力题库 /
├── app.py
├── database.db（运行后自动生成）
├── static/
│├── audio/（上传的音频自动存储）
│├── generated/（生成的拼接音频存储）
│└── ordersfile/（需手动放入序号提示音和结束音）
└── templates/
  ├── upload.html
  ├── view.html
  └── generate.html
步骤 2：准备提示音文件（可选但建议）在 static/ordersfile/ 目录下放入：
序号提示音：01.mp3、02.mp3...30.mp3（对应第 1-30 题的提示音）
结束音：over.mp3（音频结尾的结束提示音）
步骤 3：启动系统
打开终端 / CMD/PowerShell，进入项目目录（如 cd /Users/xxx/HSK 听力题库 或 cd C:\xxx\HSK 听力题库）
执行启动命令：
Mac/Linux：python3 app.py
Windows：python app.py
启动成功后，终端会显示「Running on http://0.0.0.0:5001/」
步骤 4：访问系统打开浏览器，输入地址：http://localhost:5001，即可使用系统。
核心功能说明
上传页面（首页）：上传 MP3 格式音频，填写题目文字、答案、等级、出处所有信息自动保存到本地 database.db，音频存储到 static/audio/
查看 / 检索页面（/view）：按等级（HSK1-HSK7-9）、出处（真题 / 模拟题 / 自拟题）筛选试题可多选试题，点击「生成选中的试题」进入音频拼接页面
音频生成页面（/generate）：调整试题顺序（拖拽或上下按钮）设置每题后的空白间隔（5-30 秒）点击「生成拼接音频」，自动拼接：序号提示音→题目音频→空白间隔→结束音生成成功后可下载拼接后的 MP3 文件

常见问题解决
端口占用（Errno 48）：修改 app.py 最后一行的 port=5001 为其他端口（如 5002），重启后访问http://localhost:5002
音频生成失败：检查 ffmpeg 是否安装成功（终端执行 ffmpeg -version）检查提示音文件是否存在（static/ordersfile/ 下的 01.mp3、over.mp3 等）
依赖包安装失败：升级 pip：Mac/Linux 执行 pip3 install --upgrade pip；Windows 执行 pip install --upgrade pip换国内源安装：Mac/Linux 执行 pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple flask werkzeug pydub；Windows 执行 pip install -i https://pypi.tuna.tsinghua.edu.cn/simple flask werkzeug pydub

版权声明© Chingyu Kao 2025
