import { PetCustomizationTopBar } from "@/components/pet/pet-customization-top-bar";

export default function PetCustomizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      <PetCustomizationTopBar />
      {children}
    </div>
  );
}
