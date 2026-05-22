const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');

const PREMIUM_PRODUCTS = [
  {
    name: 'Verona Luxe Sofa',
    categoryName: 'Sofa',
    price: 144420,
    stock: 8,
    imageFile: 'verona_sofa_clean.png',
    modelFile: null,
    description: 'A timeless expression of Italian craftsmanship. Deep cushioning, hand-stitched upholstery, and a solid walnut base. Engineered for ultimate comfort without compromising structural grace.',
    is_active: true
  },
  {
    name: 'Vero Modular Chair',
    categoryName: 'Chair',
    price: 72500,
    stock: 12,
    imageFile: 'armchair_clean.png',
    modelFile: 'chair.glb', // Let's attach our gorgeous 3D model!
    description: 'Effortless comfort meets architectural precision. Premium custom-tint linen with a solid, light oak frame. Designed to make your space feel open, breathable, and deeply refined.',
    is_active: true
  },
  {
    name: 'Rustic Seat Bar Stool',
    categoryName: 'Chair',
    price: 39440,
    stock: 15,
    imageFile: 'rustic_chair_clean.png',
    modelFile: null,
    description: 'Raw beauty with refined execution. Reclaimed European oak combined with a robust hand-woven rattan seat. A stunning highlight for any high-end kitchen island or home lounge.',
    is_active: true
  },
  {
    name: 'Nova Line Lamp',
    categoryName: 'Lamp',
    price: 24360,
    stock: 20,
    imageFile: 'nova_lamp_clean.png',
    modelFile: null,
    description: 'Sculptural minimalism at its absolute finest. A sleek, hand-burnished brass stem with a delicate mouth-blown glass diffuser that emits a warm, ambient, museum-grade glow.',
    is_active: true
  },
  {
    name: 'Aurelius Lounge Chair',
    categoryName: 'Chair',
    price: 109620,
    stock: 6,
    imageFile: 'lounge_chair_clean.png',
    modelFile: null,
    description: 'The pinnacle of luxury relaxation. Generous, sweeping proportions featuring custom cashmere-blend upholstery resting elegantly on a smooth-gliding silent rotating base.',
    is_active: true
  },
  {
    name: 'Nordic Dining Table',
    categoryName: 'Table',
    price: 185600,
    stock: 4,
    imageFile: 'dining-table.png',
    modelFile: null,
    description: 'Solid European white oak displaying pristine clean Scandinavian lines. Seats up to eight people comfortably with an organic, natural oiled finish that highlights the authentic wood grain.',
    is_active: true
  }
];

async function seed() {
  try {
    console.log('=== STARTING DATABASE SEEDING PROCESS ===');

    // 1. Ensure Buckets Exist & are Public
    console.log('\n--- Ensuring Storage Buckets ---');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;

    const bucketNames = buckets.map(b => b.name);
    if (!bucketNames.includes('images')) {
      console.log('Creating images bucket...');
      await supabase.storage.createBucket('images', { public: true });
    }
    if (!bucketNames.includes('models')) {
      console.log('Creating models bucket...');
      await supabase.storage.createBucket('models', { public: true });
    }

    // 2. Fetch or Create Categories
    console.log('\n--- Seeding Categories ---');
    const categoriesToEnsure = ['Sofa', 'Chair', 'Lamp', 'Table', 'Bed', 'Desk'];
    const categoryMap = {};

    for (const catName of categoriesToEnsure) {
      const { data: existingCat, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('name', catName)
        .maybeSingle();

      if (catError) throw catError;

      if (existingCat) {
        console.log(`Category "${catName}" already exists with ID: ${existingCat.id}`);
        categoryMap[catName] = existingCat.id;
      } else {
        console.log(`Creating category: "${catName}"`);
        const { data: newCat, error: insertError } = await supabase
          .from('categories')
          .insert([{ name: catName }])
          .select()
          .single();

        if (insertError) throw insertError;
        categoryMap[catName] = newCat.id;
      }
    }

    // 3. Upload Images and Models
    console.log('\n--- Uploading Premium Assets to Supabase ---');
    const seededProducts = [];

    for (const prod of PREMIUM_PRODUCTS) {
      console.log(`Processing "${prod.name}"...`);

      // Upload Image
      const imagePath = path.join(IMAGES_DIR, prod.imageFile);
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Local asset image does not exist: ${imagePath}`);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const imageExt = path.extname(prod.imageFile);
      const imageDbName = `${prod.imageFile.replace('_clean', '').replace(imageExt, '')}_${Date.now()}${imageExt}`;

      console.log(`  Uploading image: ${prod.imageFile} -> ${imageDbName}`);
      const { error: imgUploadError } = await supabase.storage
        .from('images')
        .upload(imageDbName, imageBuffer, {
          contentType: imageExt === '.jpg' || imageExt === '.jpeg' ? 'image/jpeg' : 'image/png',
          upsert: true
        });

      if (imgUploadError) throw imgUploadError;

      const { data: imgUrlData } = supabase.storage.from('images').getPublicUrl(imageDbName);
      const imageUrl = imgUrlData.publicUrl;
      console.log(`  Uploaded image URL: ${imageUrl}`);

      // Upload Model if present
      let modelUrl = null;
      if (prod.modelFile) {
        const modelPath = path.join(ASSETS_DIR, prod.modelFile);
        if (fs.existsSync(modelPath)) {
          const modelBuffer = fs.readFileSync(modelPath);
          const modelDbName = `model_${prod.modelFile.replace('.glb', '')}_${Date.now()}.glb`;

          console.log(`  Uploading 3D model: ${prod.modelFile} -> ${modelDbName}`);
          const { error: modelUploadError } = await supabase.storage
            .from('models')
            .upload(modelDbName, modelBuffer, {
              contentType: 'model/gltf-binary',
              upsert: true
            });

          if (modelUploadError) throw modelUploadError;

          const { data: modelUrlData } = supabase.storage.from('models').getPublicUrl(modelDbName);
          modelUrl = modelUrlData.publicUrl;
          console.log(`  Uploaded model URL: ${modelUrl}`);
        } else {
          console.warn(`  Warning: Model file not found at ${modelPath}`);
        }
      }

      seededProducts.push({
        name: prod.name,
        price: prod.price,
        stock: prod.stock,
        image_url: imageUrl,
        model_url: modelUrl,
        category_id: categoryMap[prod.categoryName] || null,
        description: prod.description,
        is_active: prod.is_active
      });
    }

    // 4. Delete Old Products
    console.log('\n--- Cleaning up existing Products from database ---');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything securely

    if (deleteError) throw deleteError;
    console.log('Successfully cleared all existing products.');

    // 5. Insert Premium Products
    console.log('\n--- Seeding Premium Products ---');
    const { data: insertedData, error: insertError } = await supabase
      .from('products')
      .insert(seededProducts)
      .select();

    if (insertError) throw insertError;
    console.log(`Successfully seeded ${insertedData.length} premium products!`);

    console.log('\n=== SEEDING COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('\n❌ Seeding failed with error:', err);
  }
}

seed();
