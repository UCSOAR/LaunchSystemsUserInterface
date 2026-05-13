/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("iem7zt60sts5imk")

  collection.name = "FcbControlStatus"

  // remove
  collection.schema.removeField("ulzpn8un")

  // remove
  collection.schema.removeField("hjwapp3k")

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("iem7zt60sts5imk")

  collection.name = "CombustionControlStatus"

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ulzpn8un",
    "name": "drain_open",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "hjwapp3k",
    "name": "mev_open",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
})
