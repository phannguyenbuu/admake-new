import pymongo
from bson.json_util import dumps

client = pymongo.MongoClient("mongodb+srv://phungabao2705:4EJnXChTVawmG1fJ@data1dslot.hcenhyz.mongodb.net/adsmake")
db = client["adsmake"]



collections = db.list_collection_names()
print(collections)


for coll in collections:
    collection = db[coll]

    # Lấy tất cả tài liệu trong collection users
    cursor = collection.find()

    # Chuyển cursor thành JSON string
    json_data = dumps(cursor, indent=2)

    # Ghi vào file users.json
    with open(f"json/{coll}.json", "w") as f:
        f.write(json_data)

    print("Đã xuất collection users ra file users.json")
