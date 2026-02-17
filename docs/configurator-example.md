# Configurator Example: How It Works

This document walks through a concrete example of how the watch configurator works with layered images.

---

## The Flow (Step by Step)

Imagine a customer building a custom watch. Here's what they see at each step:

### Step 1: Choose Watch Style (Function)

**Options:** Oak, Naut, Sub, Chronograph, DJ, DD, GMT, Skeleton

**Customer selects:** Oak

**What appears in the preview:**
- The Oak watch image (base layer)
- This becomes the foundation — the main watch shape/style

```
┌─────────────────────────┐
│                         │
│    [Oak watch image]    │  ← Base layer (z-index 0)
│                         │
└─────────────────────────┘
```

---

### Step 2: Choose Case Colour

**Options:** Yellow Gold, Black, Rose Gold, Stainless Steel

**Customer selects:** Yellow Gold

**What appears in the preview:**
- The Oak watch (still visible)
- PLUS a transparent layer showing the yellow gold case on top
- The main image now shows Oak + Yellow Gold case

```
┌─────────────────────────┐
│                         │
│  [Yellow Gold case]     │  ← Case layer (z-index 10)
│    [Oak watch]          │  ← Base layer (still there)
│                         │
└─────────────────────────┘
```

---

### Step 3: Choose Dial

**Options:** Arctic White, Onyx Black, Midnight Blue, Champagne Gold

**Customer selects:** Arctic White

**What appears in the preview:**
- Oak (base) + Yellow Gold case + Arctic White dial
- Each new selection adds a layer on top

```
┌─────────────────────────┐
│                         │
│  [Arctic White dial]    │  ← Dial layer (z-index 20)
│  [Yellow Gold case]     │  ← Case layer
│    [Oak watch]          │  ← Base layer
│                         │
└─────────────────────────┘
```

---

### Step 4: Choose Hands

**Options:** Standard, Luminous, etc.

**Customer selects:** Standard

**What appears:**
- Oak + Yellow Gold case + Arctic White dial + Standard hands
- The complete watch is now visible

```
┌─────────────────────────┐
│                         │
│  [Standard hands]       │  ← Hands layer (z-index 30)
│  [Arctic White dial]    │
│  [Yellow Gold case]     │
│    [Oak watch]          │
│                         │
└─────────────────────────┘
```

---

### Step 5: Choose Strap (if applicable)

**Options:** Leather Black, Metal, etc.

**Customer selects:** Leather Black

**Final preview:**
- All layers stacked: Oak + Yellow Gold + Arctic White + Standard hands + Leather Black strap
- The customer sees their complete custom watch before adding to cart

---

## Key Points

1. **Layers stack** — Each selection adds a layer. Nothing replaces the previous one.

2. **Order matters** — Layers are drawn in z-index order (base first, then case, dial, hands, strap).

3. **Transparent PNGs** — For case, dial, hands, and strap, you use transparent PNGs so they overlay correctly on the base watch.

4. **Fallback** — If you don't have layer images yet, the configurator uses the regular thumbnail images (`image_url`). It still works; the stacking might just look different until you add proper layer assets.

---

## Visual Summary

| Step   | Customer Chooses | What Shows in Preview                    |
|--------|------------------|------------------------------------------|
| 1      | Oak              | Oak watch                                |
| 2      | Yellow Gold      | Oak + yellow gold case                   |
| 3      | Arctic White     | Oak + yellow gold + white dial           |
| 4      | Standard hands   | Oak + yellow gold + white dial + hands   |
| 5      | Leather Black    | Complete watch with all customizations  |

---

## Without Layer Images (Current State)

If you haven't uploaded layer images yet:
- The configurator uses `image_url` (thumbnail) for each selected option
- It stacks those images — so you might see the full Oak image, then the full Yellow Gold image on top (which could look odd if they're not designed as layers)
- Once you add proper transparent layer PNGs, the composite will look correct

The configurator works either way; layer images just make the composite look polished.
