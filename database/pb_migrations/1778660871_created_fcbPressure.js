/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "x586go4vh3n9egf",
    "created": "2026-05-13 08:27:51.862Z",
    "updated": "2026-05-13 08:27:51.862Z",
    "name": "fcbPressure",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "klaoquex",
        "name": "fcbPressure",
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
  const collection = dao.findCollectionByNameOrId("x586go4vh3n9egf");

  return dao.deleteCollection(collection);
})
