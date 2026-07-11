import cafeImg from "@/assets/biz-cafe.jpg";
import hotelImg from "@/assets/biz-hotel.jpg";
import shopImg from "@/assets/biz-shop.jpg";
import energyImg from "@/assets/biz-energy.jpg";

const IMAGES: Record<string, string> = {
  cafe: cafeImg,
  hotel: hotelImg,
  shop: shopImg,
  energy: energyImg,
};

export function businessImage(key: string | null | undefined): string {
  return IMAGES[key ?? "cafe"] ?? cafeImg;
}
