import { CrowdfundSearch } from "@/pages/search/CrowdfundSearch.tsx";
import { PartySearch } from "@/pages/search/PartySearch.tsx";
import { ProfileSearch } from "@/pages/search/ProfileSearch.tsx";

export const Search = () => {
  return (
    <div className="md:px-6 px-3 py-6 flex flex-wrap justify-center gap-6">
      <PartySearch />
      <CrowdfundSearch />
      <ProfileSearch />
    </div>
  );
};
