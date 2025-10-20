module.exports = {
    "apps": [
        {
            "name": "backend-flask-landing-page",
            "cwd": "./lead-be",
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            "env": {
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                "PORT": "6999",
                "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_chat"
            }
        },
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
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
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
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            "env": {
                "PORT": "6001",
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
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            "env": {
                "PORT": "6002",
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
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            "env": {
                "PORT": "6003",
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
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            "env": {
                "PORT": "6004",
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
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            "env": {
                "PORT": "6005",
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
        }
    ]
}