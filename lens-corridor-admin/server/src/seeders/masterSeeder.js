require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const LensCategory = require('../models/LensCategory');
const Coating = require('../models/Coating');
const EyePower = require('../models/EyePower');
const Admin = require('../models/Admin');
const FrameShape = require('../models/FrameShape');

// Frame shapes (for /api/frame-shapes)
const frameShapeData = [
  {
    shape: 'square',
    title: 'Square',
    subtitle: 'Bold full-rim profile',
    meta: 'Classic retail bestseller',
    code: 'FS-SQ',
    status: 'Active',
    priority: 1,
    description: 'Defined corners with balanced thickness',
    detailValues: ['Square', 'Square', 'Medium to wide faces', 'Defined corners with balanced thickness', 1, 'Active', 'FS-SQ'],
  },
  {
    shape: 'rectangle',
    title: 'Rectangle',
    subtitle: 'Sharper everyday shape',
    meta: 'Highlighted in current catalog',
    code: 'FS-RE',
    status: 'Active',
    priority: 2,
    description: 'Clean horizontal shape with modern bridge',
    detailValues: ['Rectangle', 'Rectangle', 'Professional everyday wear', 'Clean horizontal shape with modern bridge', 2, 'Active', 'FS-RE'],
  },
  {
    shape: 'aviator',
    title: 'Aviator',
    subtitle: 'Lightweight metal silhouette',
    meta: 'Premium sunglass crossover',
    code: 'FS-AV',
    status: 'Review',
    priority: 3,
    description: 'Rounded lower curve with thin metal rim',
    detailValues: ['Aviator', 'Aviator', 'Medium and long face profiles', 'Rounded lower curve with thin metal rim', 3, 'Review', 'FS-AV'],
  },
  {
    shape: 'geometric',
    title: 'Geometric',
    subtitle: 'Angular statement frame',
    meta: 'Fashion-led assortment',
    code: 'FS-GE',
    status: 'Active',
    priority: 4,
    description: 'Structured multi-angle frame for premium displays',
    detailValues: ['Geometric', 'Geometric', 'Trend-forward face styling', 'Structured multi-angle frame for premium displays', 4, 'Active', 'FS-GE'],
  },
  {
    shape: 'contact-lens',
    title: 'Contact Lens',
    subtitle: 'Lens-only wearable category',
    meta: 'Cross-category add-on',
    code: 'FS-CL',
    status: 'Active',
    priority: 5,
    description: 'Soft lens category shown alongside frame shapes',
    detailValues: ['Contact Lens', 'Contact Lens', 'Prescription and cosmetic users', 'Soft lens category shown alongside frame shapes', 5, 'Active', 'FS-CL'],
  },
];

// ─── Seed Data ───────────────────────────────────────────────

const lensCategoryData = [
  {
    categoryName: 'Anti-Glare Premium',
    displayLabel: 'Anti-Glare Premium',
    linkedPricingBand: 'Band-A',
    description: 'Double side anti-glare lens with scratch resistant coating',
    priority: 1,
    internalCode: 'AGP001',
    usageAndMapping: 'Anti-glare, scratch resistant, premium coating',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758d',
  },
  {
    categoryName: 'Lenskart BLU Screen',
    displayLabel: 'Lenskart BLU Screen',
    linkedPricingBand: 'Band-B',
    description: 'Screen protection lenses that minimize eye strain',
    priority: 2,
    internalCode: 'LBLU001',
    usageAndMapping: 'Blue light filter, screen protection, smudge resistant',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758d',
  },
  {
    categoryName: 'Owndays Japan BLU+ Thin',
    displayLabel: 'Owndays Japan BLU+ Thin',
    linkedPricingBand: 'Band-C',
    description: 'Thin premium Japanese lenses with advanced screen protection',
    priority: 3,
    internalCode: 'OJBT001',
    usageAndMapping: 'Thin lens, blue light protection, anti-glare',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758d',
  },
  {
    categoryName: 'Owndays Japan BLU+ iShield',
    displayLabel: 'Owndays Japan BLU+ iShield',
    linkedPricingBand: 'Band-D',
    description: 'Night drive and low-light visibility enhancement lenses',
    priority: 4,
    internalCode: 'OJBI001',
    usageAndMapping: 'Night drive coating, low-light visibility, advanced protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758d',
  },
  {
    categoryName: 'Owndays Japan BLU+',
    displayLabel: 'Owndays Japan BLU+',
    linkedPricingBand: 'Band-E',
    description: 'Advanced Japanese blue light protection lenses',
    priority: 5,
    internalCode: 'OJBP001',
    usageAndMapping: 'Blue light protection, anti-glare, scratch resistant',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758d',
  },
  // ====
  {
    categoryName: 'BLU Screen Lenses',
    displayLabel: 'BLU Screen Lenses',
    linkedPricingBand: 'Band-A',
    description: 'Screen protection lenses that minimize eyestrain and resist scratches & smudges',
    priority: 1,
    internalCode: 'BSL001',
    usageAndMapping: 'Blue light protection, screen usage, anti-smudge coating',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Owndays Japan BLU+ iShield',
    displayLabel: 'Owndays Japan BLU+ iShield',
    linkedPricingBand: 'Band-B',
    description: 'Japanese night-driving lenses with reflection control and screen protection',
    priority: 2,
    internalCode: 'OBJI001',
    usageAndMapping: 'Night driving, anti-reflection, blue light protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Brown Tinted Color Lenses',
    displayLabel: 'Brown Tinted Color Lenses',
    linkedPricingBand: 'Band-C',
    description: 'Brown tinted lenses for outdoor activities and UV protection',
    priority: 3,
    internalCode: 'BTCL001',
    usageAndMapping: 'Outdoor activities, UV protection, color tint',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Pink Tinted Color Lenses',
    displayLabel: 'Pink Tinted Color Lenses',
    linkedPricingBand: 'Band-D',
    description: 'Pink tinted lenses with enhanced depth and visual clarity',
    priority: 4,
    internalCode: 'PTCL001',
    usageAndMapping: 'Fashion tint, visual clarity, UV protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Yellow Tinted Color Lenses',
    displayLabel: 'Yellow Tinted Color Lenses',
    linkedPricingBand: 'Band-E',
    description: 'Yellow tinted lenses ideal for day/night driving and UV protection',
    priority: 5,
    internalCode: 'YTCL001',
    usageAndMapping: 'Night driving, enhanced contrast, UV protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Blue Tinted Color Lenses',
    displayLabel: 'Blue Tinted Color Lenses',
    linkedPricingBand: 'Band-F',
    description: 'Blue tinted lenses ideal for beaches, sports, and UV protection',
    priority: 6,
    internalCode: 'BTBL001',
    usageAndMapping: 'Beach wear, sports use, UV protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Green Tinted Color Lenses',
    displayLabel: 'Green Tinted Color Lenses',
    linkedPricingBand: 'Band-G',
    description: 'Green tinted lenses that reduce glare and protect from harmful UV rays',
    priority: 7,
    internalCode: 'GTCL001',
    usageAndMapping: 'Glare reduction, outdoor usage, UV protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  {
    categoryName: 'Grey Tinted Color Lenses',
    displayLabel: 'Grey Tinted Color Lenses',
    linkedPricingBand: 'Band-H',
    description: 'Grey tinted lenses ideal for summers with UV protection',
    priority: 8,
    internalCode: 'GTCL002',
    usageAndMapping: 'Summer wear, glare reduction, UV protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb8769758e',
  },
  // ====

  {
    categoryName: 'Lenskart Anti-Glare Normal Corridor Progressive',
    displayLabel: 'Lenskart Anti-Glare Normal Corridor Progressive',
    linkedPricingBand: 'Band-A',
    description: 'Anti-glare progressive lenses perfect for outdoors with enhanced reading experience',
    priority: 1,
    internalCode: 'LAGNCP001',
    usageAndMapping: 'Anti-glare, progressive vision, outdoor usage',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb87697590',
  },
  {
    categoryName: 'Lenskart BLU Normal Corridor Progressive',
    displayLabel: 'Lenskart BLU Normal Corridor Progressive',
    linkedPricingBand: 'Band-B',
    description: 'Blue light protection progressive lenses with enhanced reading experience',
    priority: 2,
    internalCode: 'LBNCP001',
    usageAndMapping: 'Blue light protection, progressive vision, screen usage',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb87697590',
  },
  {
    categoryName: 'Lenskart BLU Thin Wide Corridor Progressive',
    displayLabel: 'Lenskart BLU Thin Wide Corridor Progressive',
    linkedPricingBand: 'Band-C',
    description: 'Wide field progressive lenses with thin design and blue light protection',
    priority: 3,
    internalCode: 'LBTWCP001',
    usageAndMapping: 'Wide vision, progressive lens, blue light protection',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb87697590',
  },
  {
    categoryName: 'Circular Bi-focal KT',
    displayLabel: 'Circular Bi-focal KT',
    linkedPricingBand: 'Band-A',
    description: 'Bi-focal lenses with concentrated circular reading zone and enhanced outdoor vision',
    priority: 1,
    internalCode: 'CBFKT001',
    usageAndMapping: 'Bifocal vision, reading support, outdoor usage',
    status: 'Active',
    powertype_id: '6a02fb0ae8757fbb87697591',
  },
  // ===
];

const coatingData = () => {

  return [
    {
      coatingName: 'Anti-Reflective',
      displayLabel: 'Anti-Reflective (AR)',
      compatibleLensTypes: [],
      description: 'Reduces reflections and glare',
      internalCode: 'AR001',
      priority: 1,
      status: 'Active',
    },
    {
      coatingName: 'Anti-Scratch',
      displayLabel: 'Anti-Scratch',
      compatibleLensTypes: [],
      description: 'Protects lens surface from scratches',
      internalCode: 'AS001',
      priority: 2,
      status: 'Active',
    },
    {
      coatingName: 'UV Protection',
      displayLabel: 'UV Protection',
      compatibleLensTypes: [],
      description: 'Blocks harmful UV rays',
      internalCode: 'UV001',
      priority: 3,
      status: 'Active',
    },
    {
      coatingName: 'Photochromic',
      displayLabel: 'Photochromic (Transition)',
      compatibleLensTypes: [],
      description: 'Darkens in sunlight, clears indoors',
      internalCode: 'PC001',
      priority: 4,
      status: 'Active',
    },
    {
      coatingName: 'Hydrophobic',
      displayLabel: 'Hydrophobic',
      compatibleLensTypes: [],
      description: 'Repels water and smudges',
      internalCode: 'HY001',
      priority: 5,
      status: 'Review',
    },
  ];
};

const eyePowerData = [
  { eye: 'Both', sphere: 0.00, cylinder: 0.00, axis: 0, addition: null, pupillaryDistance: 64, status: 'Active' },
  { eye: 'Right', sphere: -1.00, cylinder: -0.50, axis: 90, addition: null, pupillaryDistance: 32, status: 'Active' },
  { eye: 'Left', sphere: -1.25, cylinder: -0.75, axis: 180, addition: null, pupillaryDistance: 32, status: 'Active' },
  { eye: 'Right', sphere: -2.00, cylinder: -1.00, axis: 45, addition: null, pupillaryDistance: 33, status: 'Active' },
  { eye: 'Left', sphere: -2.50, cylinder: -0.50, axis: 135, addition: null, pupillaryDistance: 31, status: 'Active' },
  { eye: 'Both', sphere: +1.00, cylinder: 0.00, axis: 0, addition: 1.50, pupillaryDistance: 64, status: 'Active' },
  { eye: 'Both', sphere: +2.00, cylinder: -0.50, axis: 90, addition: 2.00, pupillaryDistance: 62, status: 'Active' },
  { eye: 'Right', sphere: -3.00, cylinder: -1.50, axis: 60, addition: null, pupillaryDistance: 33, status: 'Active' },
  { eye: 'Left', sphere: -3.50, cylinder: -1.00, axis: 120, addition: null, pupillaryDistance: 31, status: 'Active' },
  { eye: 'Both', sphere: +0.50, cylinder: -0.25, axis: 15, addition: 2.50, pupillaryDistance: 63, status: 'Active' },
];

const adminSeedData = {
  name: 'Super Admin',
  email: 'admin@example.com',
  password: 'password',
  role: 'admin',
  status: 'active',
};

// ─── Seeder Function ─────────────────────────────────────────

const seedMasters = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting Master Seeder...\n');

    // Clear existing data
    await LensCategory.deleteMany();
    await Coating.deleteMany();
    await EyePower.deleteMany();
    await FrameShape.deleteMany();
    await Admin.deleteMany();
    console.log('🗑️  Cleared existing master data');


    // Seed Lens Categories
    const categories = await LensCategory.insertMany(lensCategoryData);
    console.log(`✅ Lens Categories seeded: ${categories.length}`);

    // Seed Coatings
    const coatings = await Coating.insertMany(coatingData());
    console.log(`✅ Coatings seeded: ${coatings.length}`);

    // Seed Eye Powers
    const eyePowers = await EyePower.insertMany(eyePowerData);
    console.log(`✅ Eye Powers seeded: ${eyePowers.length}`);

    // Seed Frame Shapes
    const frameShapes = await FrameShape.insertMany(frameShapeData);
    console.log(`✅ Frame Shapes seeded: ${frameShapes.length}`);

    // Seed Admin

    const hashedPassword = await bcrypt.hash(adminSeedData.password, 10);
    const admin = await Admin.create({
      name: adminSeedData.name,
      email: adminSeedData.email,
      password: hashedPassword,
      role: adminSeedData.role,
      status: adminSeedData.status,
    });
    console.log(`✅ Admin seeded: ${admin.email}`);

    console.log('\n🎉 Master Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedMasters();
