

# Hero Title Consistency Fix

## Problem

The hero section titles across subpages are not consistently positioned:

| Page | Current Position |
|------|-----------------|
| Etlap (Napi Ajánlat) | Center-center |
| About (Rólunk) | Bottom-left |
| Contact (Kapcsolat) | Bottom-center |
| Gallery (Galéria) | No image hero (different style) |

## Solution

Update all subpages with image heroes to use center-center positioning, matching the Etlap page design.

---

## Changes Required

### 1. About.tsx (Rólunk)

**Current** (lines 51-61):
```tsx
<div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
  <div className="max-w-6xl mx-auto">
    <h1>Rólunk</h1>
    <p>Családi hagyományok, modern körülmények</p>
  </div>
</div>
```

**New** (centered):
```tsx
<div className="absolute inset-0 flex items-center justify-center">
  <div className="text-center text-white px-6">
    <h1>Rólunk</h1>
    <p>Családi hagyományok, modern körülmények</p>
  </div>
</div>
```

---

### 2. Contact.tsx (Kapcsolat)

**Current** (lines 61-70):
```tsx
<div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
  <div className="max-w-4xl mx-auto text-center">
    <h1>Kapcsolat</h1>
    <p>Vegye fel velünk a kapcsolatot!</p>
  </div>
</div>
```

**New** (centered):
```tsx
<div className="absolute inset-0 flex items-center justify-center">
  <div className="text-center text-white px-6">
    <h1>Kapcsolat</h1>
    <p>Vegye fel velünk a kapcsolatot!</p>
  </div>
</div>
```

---

### 3. Gallery.tsx (Galéria) - Optional

The Gallery page uses a different hero style (no background image, just padding). To make it fully consistent with other subpages, we could add an image hero with centered title. However, this changes the page's current design significantly.

**Decision**: Keep Gallery as-is for now, or add image hero if desired.

---

## Unified Hero Template

All image-based hero sections will use this structure:

```tsx
<section className="relative h-[35vh] md:h-[40vh] overflow-hidden">
  <img src={heroImage} alt="..." className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center text-white px-6">
      <h1 className="text-3xl md:text-5xl font-sofia font-bold mb-2 animate-fade-in-up">
        {title}
      </h1>
      <p className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0" 
         style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        {subtitle}
      </p>
    </div>
  </div>
</section>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/About.tsx` | Center title in hero |
| `src/pages/Contact.tsx` | Center title in hero |

---

## Visual Result

All subpages will have:
- Same hero height: `h-[35vh] md:h-[40vh]`
- Same gradient overlay
- Title centered both horizontally and vertically
- Consistent text styling and animations

