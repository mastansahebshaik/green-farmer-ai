import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Navigation, Phone, Sprout, Store } from "lucide-react";
import { Suspense, lazy, useState } from "react";

const ShopsMap = lazy(() => import("@/components/ShopsMap"));
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { findNearbyShops, type NearbyShop } from "@/lib/places.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "Fertiliser shops near me — KisanSahayak" },
      {
        name: "description",
        content:
          "Turn on your location to find fertiliser, seed and farm supply shops close to your village, with distance, phone number and directions.",
      },
      { property: "og:title", content: "Fertiliser shops near me — KisanSahayak" },
      {
        property: "og:description",
        content: "Find nearby fertiliser and seed shops with distance and directions.",
      },
    ],
  }),
  component: ShopsPage,
});

function ShopsPage() {
  const { t } = useI18n();
  const find = useServerFn(findNearbyShops);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error(t("locationDenied"));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { shops: found } = await find({
            data: {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              radiusKm: 15,
            },
          });
          setShops(found);
          setCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setFocusId(null);
          setSearched(true);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not find shops");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error(t("locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-semibold text-soil">{t("shopsTitle")}</h1>
      <p className="mt-1 text-[15px] font-medium text-soil-500">{t("shopsSubtitle")}</p>

      <Link
        to="/fertilizers"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 text-base font-semibold text-leaf-700 ring-1 ring-leaf/30"
      >
        <Sprout className="size-5" />
        {t("fertTitle")}
      </Link>

      <button
        type="button"
        onClick={locate}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-sun py-4 font-display text-lg font-semibold text-soil ring-1 ring-sun-700 disabled:opacity-70"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Navigation className="size-5" />}
        {loading ? t("locating") : t("useLocation")}
      </button>

      {center ? (
        <div className="mt-5 overflow-hidden rounded-2xl">
          <ClientOnly fallback={<div className="h-72 w-full animate-pulse rounded-2xl bg-cream-2" />}>
            <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-2xl bg-cream-2" />}>
              <ShopsMap center={center} shops={shops} focusId={focusId} />
            </Suspense>
          </ClientOnly>
        </div>
      ) : null}

      <section className="mt-6 space-y-2.5">
        {shops.map((shop) => (
          <article
            key={shop.id}
            onClick={() => setFocusId(shop.id)}
            className="cursor-pointer rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf/15">
                <Store className="size-5 text-leaf-700" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg font-semibold text-soil">{shop.name}</h2>
                <p className="truncate text-sm font-medium text-soil-500">
                  {shop.distanceKm} {t("kmAway")}
                  {shop.address ? ` · ${shop.address}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lon}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-leaf py-3 text-sm font-semibold text-cream"
              >
                <MapPin className="size-4" />
                {t("openMap")}
              </a>
              {shop.phone ? (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-cream px-4 py-3 text-sm font-semibold text-soil ring-1 ring-black/10"
                >
                  <Phone className="size-4" />
                  {shop.phone}
                </a>
              ) : null}
            </div>
          </article>
        ))}

        {searched && shops.length === 0 ? (
          <p className="rounded-2xl bg-cream-2 p-4 text-[15px] font-medium text-soil-500 ring-1 ring-black/5">
            {t("noShops")}
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
