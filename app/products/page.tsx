import { Suspense } from "react";
import ProductsContent from "./ProductsContent";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
          Loading products…
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
