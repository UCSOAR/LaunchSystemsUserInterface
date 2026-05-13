/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "09bsi52pyehviat",
    "created": "2026-05-13 04:41:14.086Z",
    "updated": "2026-05-13 04:41:14.086Z",
    "name": "fsbPressure",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "9kcqxy7l",
        "name": "pt1_pressure",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "ylcpwh8n",
        "name": "pt2_pressure",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "9ybi04kp",
        "name": "pt3_pressure",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "xfzin0rl",
        "name": "pt4_pressure",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("09bsi52pyehviat");

  return dao.deleteCollection(collection);
})
