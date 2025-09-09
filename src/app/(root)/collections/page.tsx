import { db } from "@/lib/db";
import { collections, productCollections, products, productImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";

export default async function CollectionsPage() {
  try {
    const allCollections = await db.select().from(collections);

    if (!allCollections || allCollections.length === 0) {
      return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Collections</h1>
            <p className="text-gray-500 text-lg">No collections available yet.</p>
          </div>
        </div>
      );
    }

    const collectionsWithProducts = await Promise.all(
      allCollections.map(async (collection) => {
        try {
          const collectionProducts = await db
            .select({
              id: products.id,
              name: products.name,
            })
            .from(productCollections)
            .innerJoin(products, eq(productCollections.productId, products.id))
            .where(eq(productCollections.collectionId, collection.id))
            .limit(4);

          // Get the primary image for each product
          const productsWithImages = await Promise.all(
            collectionProducts.map(async (product) => {
              try {
                const primaryImage = await db
                  .select({ url: productImages.url })
                  .from(productImages)
                  .where(eq(productImages.productId, product.id))
                  .where(eq(productImages.isPrimary, true))
                  .limit(1);

                return {
                  ...product,
                  imageUrl: primaryImage[0]?.url || null,
                };
              } catch (error) {
                console.error(`Error fetching image for product ${product.id}:`, error);
                return {
                  ...product,
                  imageUrl: null,
                };
              }
            })
          );

          return {
            ...collection,
            products: productsWithImages,
          };
        } catch (error) {
          console.error(`Error fetching products for collection ${collection.id}:`, error);
          return {
            ...collection,
            products: [],
          };
        }
      })
    );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Collections</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our curated collections featuring the latest trends and timeless classics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {collectionsWithProducts.map((collection) => (
          <div
            key={collection.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {collection.name}
              </h2>
              <p className="text-gray-600 mb-4">
                Explore our {collection.name.toLowerCase()} collection
              </p>
              
              {collection.products.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Featured products:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {collection.products.map((product) => (
                      <div key={product.id} className="relative">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="rounded-md object-cover w-full h-20"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/products?collection=${collection.slug}`}
                className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors duration-200"
              >
                View Collection
              </Link>
            </div>
          </div>
        ))}
      </div>

      {collectionsWithProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No collections available yet.</p>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error("Error in CollectionsPage:", error);
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Collections</h1>
          <p className="text-red-500 text-lg">Error loading collections. Please try again later.</p>
        </div>
      </div>
    );
  }
}
