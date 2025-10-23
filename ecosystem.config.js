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
            "args": "run start",
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
        }
    ]
}