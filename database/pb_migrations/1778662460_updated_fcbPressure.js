/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("x586go4vh3n9egf")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "klaoquex",
    "name": "upper_pv_pressure",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("x586go4vh3n9egf")

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
})
