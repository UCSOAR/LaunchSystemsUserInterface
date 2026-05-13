/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "bccviqacsq4dkds",
    "created": "2026-05-13 05:28:35.800Z",
    "updated": "2026-05-13 05:28:35.800Z",
    "name": "PbbControlStatus",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "thrbpbzo",
        "name": "drain_open",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "kkhmruow",
        "name": "mev_power_enable",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
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
  const collection = dao.findCollectionByNameOrId("bccviqacsq4dkds");

  return dao.deleteCollection(collection);
})
