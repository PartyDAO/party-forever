import { SearchByAddressWidget } from "@/pages/home/SearchByAddressWidget.tsx";
import { SearchByNameWidget } from "@/pages/home/SearchByNameWidget.tsx";
import { ProfileSearch } from "@/pages/ProfileSearch.tsx";

export const Home = () => (
  <div className="p-6 flex flex-wrap justify-center gap-6">
    <SearchByNameWidget />
    <SearchByAddressWidget />
    <ProfileSearch />
  </div>
);
