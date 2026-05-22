/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "1e2lgouz5v2im2m",
    "created": "2026-05-13 04:39:55.051Z",
    "updated": "2026-05-13 04:39:55.051Z",
    "name": "fsbTemperature",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qpwen2dr",
        "name": "tc1_temperature",
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
        "id": "bzx5wlpq",
        "name": "tc2_temperature",
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
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("1e2lgouz5v2im2m");

  return dao.deleteCollection(collection);
})
