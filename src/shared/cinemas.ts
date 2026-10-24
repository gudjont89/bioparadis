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
    // As the kvikmyndir.is /theaters endpoint gives it.
    location: "Laugarási, 104 Reykjavík",
    halls: ["A salur", "B salur", "AXL"],
    logo: "logos/laugarasbio.png",
    unmarkedMeansNoSubs: false,
  },
];

export function cinemaById(id: string | null | undefined): Cinema {
  return CINEMAS.find((c) => c.id === id) ?? CINEMAS[0];
}
