# Frontend Keywords for Venue Recommendations

This document outlines the recommended keywords that the mobile frontend should offer users for restaurant and bar preferences. These keywords are **aligned with Google Places API types** to ensure optimal matching in our recommendation engine.

---

## 🍽️ Restaurant Cuisine Keywords

### Asian Cuisines
- `chinese` - Chinese Restaurant
- `japanese` - Japanese Restaurant (includes sushi, ramen)
- `sushi` - Sushi Restaurant
- `ramen` - Ramen Restaurant
- `thai` - Thai Restaurant
- `indian` - Indian Restaurant
- `korean` - Korean Restaurant
- `vietnamese` - Vietnamese Restaurant
- `asian` - General Asian (covers multiple cuisines)
- `indonesian` - Indonesian Restaurant

### European Cuisines
- `italian` - Italian Restaurant (includes pizza)
- `pizza` - Pizza Restaurant
- `french` - French Restaurant
- `spanish` - Spanish Restaurant
- `greek` - Greek Restaurant
- `turkish` - Turkish Restaurant

### Middle Eastern & Mediterranean
- `mediterranean` - Mediterranean Restaurant
- `middle eastern` - Middle Eastern Restaurant
- `lebanese` - Lebanese Restaurant

### American & Western
- `american` - American Restaurant
- `burger` - Hamburger Restaurant
- `bbq` - BBQ/Barbecue Restaurant
- `steakhouse` - Steakhouse
- `diner` - Diner
- `fast food` - Fast Food Restaurant

### Latin American
- `mexican` - Mexican Restaurant
- `brazilian` - Brazilian Restaurant

### Other Specialties
- `african` - African Restaurant
- `seafood` - Seafood Restaurant
- `sandwich` - Sandwich Shop/Deli
- `deli` - Delicatessen

### Meal Types
- `breakfast` - Breakfast Restaurant
- `brunch` - Brunch Restaurant
- `fine dining` - Fine Dining Restaurant

### Desserts & Bakery
- `bakery` - Bakery
- `dessert` - Dessert Restaurant
- `ice cream` - Ice Cream Shop

### Dietary Preferences
- `vegetarian` - Vegetarian Restaurant
- `vegan` - Vegan Restaurant

---

## 🍺 Bar & Beverage Keywords

### Bar Types
- `bar` - General Bar
- `cocktail` - Cocktail Bar
- `wine bar` - Wine Bar
- `beer` - Beer Bar/Pub
- `pub` - Pub
- `sports bar` - Sports Bar
- `bar and grill` - Bar & Grill
- `coffee` - Coffee Shop
- `cafe` - Cafe

### Bar Ambiance (Name-based Matching)
These keywords are matched against venue names since Google Places doesn't have specific types for them:

- `speakeasy` - Hidden/secret cocktail bars
- `dive bar` - Casual, no-frills bars
- `tiki` - Tiki/tropical bars
- `karaoke` - Karaoke bars
- `live music` - Bars with live music
- `jazz` - Jazz clubs/bars
- `nightclub` - Dance clubs
- `lounge` - Cocktail lounges

---

## 🎨 Atmosphere Keywords (Optional)

These can be offered as additional filters and are matched against venue names/descriptions:

- `romantic` - Romantic ambiance
- `casual` - Casual dining
- `upscale` - Upscale/fancy
- `trendy` - Trendy spots
- `cozy` - Cozy atmosphere
- `lively` - Lively/energetic
- `quiet` - Quiet/intimate
- `rooftop` - Rooftop venues
- `outdoor` - Outdoor seating
- `patio` - Patio dining
- `waterfront` - Waterfront venues
- `views` - Scenic views

---

## 🚨 Dietary Requirements (Hard Filters)

**IMPORTANT:** These are treated as **hard requirements** in the backend. If a user selects any of these, venues that don't meet the requirement will be **excluded entirely** from recommendations.

- `vegetarian` - Must have vegetarian options
- `vegan` - Must have vegan options
- `gluten-free` - Must have gluten-free options
- `halal` - Must be halal-certified
- `kosher` - Must be kosher-certified

**UI Recommendation:** Display dietary requirements separately from cuisine preferences with clear messaging like:
> "We'll only show venues that meet your dietary needs"

---

## 💰 Budget Preferences

The backend supports these budget levels:

- `$` - Very affordable (cheap eats)
- `$$` - Budget-friendly (moderate)
- `$$$` - Mid-range (nice dining)
- `$$$$` - Upscale (fine dining/expensive)

**Matching Logic:** Backend allows ±1 price level flexibility. Example: User selects `$$`, we'll show `$`, `$$`, or `$$$` venues.

---

## 📱 Implementation Recommendations

### Option 1: Dropdown/Chip Selection (Recommended)
```
Cuisine Preferences:
[Mexican] [Italian] [Thai] [Japanese] [Vegetarian] ...

Bar Preferences:
[Cocktail Bar] [Wine Bar] [Pub] [Live Music] ...

Dietary Requirements:
[Vegetarian] [Vegan] [Gluten-Free] [Halal] [Kosher]
```

### Option 2: Free Text with Auto-suggestions
Allow users to type freely, but provide autocomplete suggestions from the keywords above. This gives flexibility while ensuring backend compatibility.

### Option 3: Hybrid Approach
- **Primary Selection:** Dropdowns for common preferences (Mexican, Italian, Bar, etc.)
- **Additional Notes:** Free text field for specifics ("I love spicy food", "No seafood")

The backend's `extract_keywords` method will parse both structured keywords and free text.

---

## 🔗 How Keywords Map to Google Places

| User Keyword | Google Places Types |
|--------------|-------------------|
| `mexican` | `mexican_restaurant` |
| `sushi` | `sushi_restaurant`, `japanese_restaurant` |
| `cocktail` | `bar`, `wine_bar` |
| `vegetarian` | `vegetarian_restaurant`, `vegan_restaurant` |
| `burger` | `hamburger_restaurant`, `american_restaurant`, `bar_and_grill` |

Full mappings are defined in `app/services/venue_ranking_service.rb` constants:
- `CUISINE_TYPE_MAPPING`
- `BAR_TYPE_MAPPING`
- `BAR_AMBIANCE_KEYWORDS`

---

## 🎯 Priority Keywords for MVP

If you need to start with a limited set, prioritize these popular options:

**Restaurants (Top 10):**
1. Mexican
2. Italian
3. Japanese / Sushi
4. Chinese
5. Thai
6. American / Burger
7. Indian
8. Pizza
9. Vegetarian
10. Seafood

**Bars (Top 5):**
1. Cocktail Bar
2. Beer / Pub
3. Wine Bar
4. Sports Bar
5. Live Music

**Dietary (Must-Have):**
- Vegetarian
- Vegan
- Gluten-Free

---

## ✅ Validation

To ensure your frontend keywords work correctly:

1. **Test in Rails Console:**
```ruby
# Test keyword extraction
VenueRankingService.extract_keywords("I love mexican food and cocktail bars")
# Should return: ["mexican", "cocktail", ...]

# Test type mapping
VenueRankingService::CUISINE_TYPE_MAPPING["mexican"]
# Should return: ["mexican_restaurant"]
```

2. **Use Exact Strings:** The keywords are case-insensitive but should match exactly (e.g., "mexican" not "Mexican cuisine")

3. **Multiple Keywords:** Users can select multiple preferences. Backend will calculate match percentage.

---

## 📞 Questions?

If you need additional keywords or custom mappings, contact the backend team. We can easily add new mappings to the constants in `venue_ranking_service.rb`.

Last Updated: 2025-01-02
