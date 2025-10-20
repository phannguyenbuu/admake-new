module.exports = {
    "apps": [
        {
            "name": "admake landing page",
            "cwd": "./landingpage",
            "script": "npm",
            "args": "run dev -- --port 4999",
            "env": {
                "PORT": "4999"
            }
        },
        {
            "name": "backend-flask-n0",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6000",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "PORT": "6000",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_chat"
            }
        },
        {
            "name": "frontend-react-n0",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4000",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/api",
                "VITE_APP_SOCKET": "https://admake.vn",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n1",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6001",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_1"
            }
        },
        {
            "name": "frontend-react-n1",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4001",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad1/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad1/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n2",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6002",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_2"
            }
        },
        {
            "name": "frontend-react-n2",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4002",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad2/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad2/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n3",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6003",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_3"
            }
        },
        {
            "name": "frontend-react-n3",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4003",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad3/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad3/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n4",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6004",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_4"
            }
        },
        {
            "name": "frontend-react-n4",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4004",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad4/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad4/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n5",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6005",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_5"
            }
        },
        {
            "name": "frontend-react-n5",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4005",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad5/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad5/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n6",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6006",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_6"
            }
        },
        {
            "name": "frontend-react-n6",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4006",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad6/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad6/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n7",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6007",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_7"
            }
        },
        {
            "name": "frontend-react-n7",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4007",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad7/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad7/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n8",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6008",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_8"
            }
        },
        {
            "name": "frontend-react-n8",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4008",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad8/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad8/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n9",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6009",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_9"
            }
        },
        {
            "name": "frontend-react-n9",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4009",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad9/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad9/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        },
        {
            "name": "backend-flask-n10",
            "cwd": "./main-be",
            "args": "-m gunicorn app:app -b 0.0.0.0:6010",
            "script": "/root/venv/bin/python",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_10"
            }
        },
        {
            "name": "frontend-react-n10",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": "run dev -- --port 4010",
            "env": {
                "VITE_APP_API_HOST": "https://admake.vn/ad10/api",
                "VITE_APP_SOCKET": "https://admake.vn/ad10/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        }
    ]
}