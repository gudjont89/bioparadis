import type { Cinema } from "./types";

/** The cinemas the scraper collects and the app offers, in top-bar order. The first is the default. */
export const CINEMAS: [Cinema, ...Cinema[]] = [
  {
    id: "bioparadis",
    kvikId: 5,
    name: "Bíó Paradís",
    location: "Hverfisgata 54, 101 Reykjavík",
    halls: ["Salur 1", "Salur 2", "Salur 3"],
    logo: "logos/bioparadis.png",
    unmarkedMeansNoSubs: true,
  },
  {
    id: "laugarasbio",
    kvikId: 4,
    name: "Laugarásbíó",
    // Locations are as the kvikmyndir.is /theaters endpoint gives them.
    location: "Laugarási, 104 Reykjavík",
    halls: ["A salur", "B salur", "AXL"],
    logo: "logos/laugarasbio.png",
    unmarkedMeansNoSubs: false,
  },
  {
    id: "sambiokringlunni",
    kvikId: 7,
    name: "Sambíóin Kringlunni",
    location: "Kringlunni 4-6, 103 Reykjavík",
    halls: ["Salur 1", "Salur 2", "Salur 3", "Ásberg"],
    logo: "logos/sambiokringlunni.png",
    unmarkedMeansNoSubs: false,
  },
  {
    id: "sambioegilsholl",
    kvikId: 8,
    name: "Sambíóin Egilshöll",
    location: "Egilshöll, Reykjavík",
    halls: ["Salur 1", "Salur 2", "Salur 3", "Salur 4"],
    logo: "logos/sambioegilsholl.png",
    unmarkedMeansNoSubs: false,
  },
  {
    id: "smarabio",
    kvikId: 1,
    name: "Smárabíó",
    location: "Smáralind, 201 Kópavogur",
    // Named halls first, then the numbered ones. No "Salur 1" or "Salur 3" seen in three weeks of data.
    halls: ["MAX", "Lúxus", "Flauel", "S7", "Salur 2", "Salur 4", "Salur 5"],
    logo: "logos/smarabio.png",
    unmarkedMeansNoSubs: false,
  },
];

export function cinemaById(id: string | null | undefined): Cinema {
  return CINEMAS.find((c) => c.id === id) ?? CINEMAS[0];
}
