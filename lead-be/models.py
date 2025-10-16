from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
# from datetime import datetime, date
import datetime
import os
from flask_cors import CORS
import random
from sqlalchemy.types import JSON
from sqlalchemy import inspect
import pytz
from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.sql import func, text
from psycopg2.extras import Json
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
import logging
import re
from flask_cors import CORS


app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
app.secret_key = 'admake-secret-token'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=15)
app.config['JWT_SECRET_KEY'] = 'admake-jwt-secret-key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

from dotenv import load_dotenv
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)

jwt = JWTManager(app)


CORS(app)


class BaseModel(db.Model):
    __abstract__ = True

    deletedAt = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    version = db.Column(db.Integer)

    def get_date(self):
        tz = pytz.timezone("Asia/Ho_Chi_Minh")  # múi giờ GMT+7
        # now = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(tz)
        return self.createdAt.replace(tzinfo=pytz.utc).astimezone(tz).date()



class UsingHistoryData(db.Model):
    __tablename__ = 'using'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'), nullable=False)
    start_time = db.Column(db.Date)
    end_time = db.Column(db.Date)
    balance_amount = db.Column(db.Float)

class LeadPayload(BaseModel):
    __tablename__ = 'lead'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    company = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    industry = db.Column(db.String(100), nullable=False)
    companySize = db.Column(db.String(50), nullable=False)
    expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    balance_amount = db.Column(db.Float)

    # Quan hệ 1-n: một Lead có nhiều historyUsing
    history_using = db.relationship('UsingHistoryData', backref='lead', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Lead {self.name}>'
    
    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def create_item(params):
        item = LeadPayload(**params)
        db.session.add(item)
        db.session.commit()
        return item