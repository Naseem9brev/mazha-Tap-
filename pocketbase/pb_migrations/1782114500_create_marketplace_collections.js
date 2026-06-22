migrate((app) => {
  const tappers = new Collection({
    type: "base",
    name: "tappers",
    listRule: "availability != 'Not available'",
    viewRule: "",
    createRule: "",
    updateRule: "edit_token = @request.body.edit_token",
    deleteRule: null,
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        max: 80,
        presentable: true,
      },
      {
        name: "photo",
        type: "file",
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["320x420", "640x840"],
      },
      {
        name: "district",
        type: "select",
        required: true,
        maxSelect: 1,
        values: [
          "Alappuzha",
          "Ernakulam",
          "Idukki",
          "Kannur",
          "Kasaragod",
          "Kollam",
          "Kottayam",
          "Kozhikode",
          "Malappuram",
          "Palakkad",
          "Pathanamthitta",
          "Thiruvananthapuram",
          "Thrissur",
          "Wayanad",
        ],
      },
      {
        name: "years_experience",
        type: "number",
        required: true,
        min: 0,
        max: 60,
      },
      {
        name: "tapping_systems",
        type: "select",
        required: true,
        maxSelect: 6,
        values: ["Conventional", "Low-intensity", "Rain-guard", "S/2 d2", "S/2 d3", "Panel protection"],
      },
      {
        name: "trees_per_day",
        type: "number",
        required: true,
        min: 1,
        max: 2000,
      },
      {
        name: "availability",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["Available now", "Available from date", "Not available"],
      },
      {
        name: "available_from",
        type: "date",
      },
      {
        name: "languages",
        type: "select",
        required: true,
        maxSelect: 3,
        values: ["Malayalam", "Tamil", "English"],
      },
      {
        name: "bio",
        type: "text",
        max: 100,
      },
      {
        name: "contact_number",
        type: "text",
        required: true,
        max: 24,
      },
      {
        name: "edit_token",
        type: "text",
        required: true,
        max: 80,
      },
    ],
    indexes: [
      "CREATE INDEX idx_tappers_district ON tappers (district)",
      "CREATE INDEX idx_tappers_availability ON tappers (availability)",
      "CREATE INDEX idx_tappers_experience ON tappers (years_experience)",
      "CREATE INDEX idx_tappers_edit_token ON tappers (edit_token)",
    ],
  });

  app.save(tappers);

  const matches = new Collection({
    type: "base",
    name: "matches",
    listRule: null,
    viewRule: null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "tapper_id",
        type: "relation",
        required: true,
        collectionId: tappers.id,
        maxSelect: 1,
        cascadeDelete: true,
      },
    ],
    indexes: ["CREATE INDEX idx_matches_tapper_id ON matches (tapper_id)"],
  });

  app.save(matches);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("matches"));
  app.delete(app.findCollectionByNameOrId("tappers"));
});
