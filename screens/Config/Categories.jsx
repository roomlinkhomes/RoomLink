// screens/config/Categories.jsx

import React from "react";

// ---------------- HOME FEED CATEGORIES ----------------
export const homeCategories = [
  {
    id: "house",
    name: "Houses & Apartments",
    description: "Self-contained, apartments, duplexes, shared rooms, etc.",
  },
  {
    id: "land",
    name: "Land & Real Estate",
    description: "Lands, plots, commercial real estate.",
  },
  {
    id: "property",
    name: "Other Properties",
    description: "Shops, offices, warehouses, etc.",
  },
];

// ---------------- VENDOR CATEGORIES ----------------
export const vendorCategories = [
  {
    id: "essentials",
    name: "Home & Room Essentials",
    description:
      "Beds, wardrobes, fridges, kitchen basics, curtains, décor.",
  },
  {
    id: "services",
    name: "Maintenance & Repairs",
    description:
      "Plumbers, electricians, painters, carpenters, cleaning, fumigation.",
  },
  {
    id: "logistics",
    name: "Moving & Logistics",
    description:
      "Relocation trucks, delivery vans, mini haulage.",
  },
  {
    id: "consumables",
    name: "Shared Consumables",
    description:
      "Cooking gas, bulk foodstuff, toiletries, cleaning supplies, WiFi sharing.",
  },
  {
    id: "lifestyle",
    name: "Lifestyle Add-ons",
    description:
      "TVs, sound systems, gym equipment, gaming, outdoor furniture.",
  },
  {
    id: "crafts",
    name: "Crafts & Materials",
    description:
      "House painters, painting materials, housing-related crafts.",
  },
];

// ---------------- OPTIONAL CATEGORY COMPONENT ----------------
export const CategoryList = ({ type = "home" }) => {
  const categories = type === "home" ? homeCategories : vendorCategories;

  return (
    <div style={{ padding: 12 }}>
      {categories.map((cat) => (
        <div
          key={cat.id}
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            backgroundColor: "#f9f9f9",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: 0, color: "#1A237E" }}>{cat.name}</h3>
          <p style={{ margin: "4px 0 0", color: "#555" }}>{cat.description}</p>
        </div>
      ))}
    </div>
  );
};
