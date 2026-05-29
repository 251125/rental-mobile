import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useListings } from "@/hooks/use-listings";
import { COLORS, KZ_CITY_COORDS, resolveImageUrl } from "@/constants";
import { Listing } from "@/types";

interface MapListing {
  id: string;
  title: string;
  price: number;
  city: string;
  imageUrl: string | null;
  coords: [number, number] | null;
}

function buildLeafletHTML(listings: MapListing[]): string {
  const data = JSON.stringify(listings);
  return `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; }
    #map { height: 100vh; width: 100vw; }
    .popup-img { width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 6px; }
    .popup-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .popup-meta { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .popup-price { font-weight: 700; font-size: 15px; color: #2563eb; }
    .popup-link { display: block; margin-top: 8px; text-align: center; background: #2563eb; color: #fff; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([48, 68], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const listings = ${data};

    listings.forEach(function(l) {
      if (!l.coords) return;
      const imgHtml = l.imageUrl
        ? '<img class="popup-img" src="' + l.imageUrl + '" onerror="this.style.display=\\'none\\'" />'
        : '';
      const popup = '<div style="min-width:180px;max-width:220px">'
        + imgHtml
        + '<div class="popup-title">' + l.title + '</div>'
        + '<div class="popup-meta">' + l.city + '</div>'
        + '<div class="popup-price">' + l.price + ' ₸/день</div>'
        + '</div>';
      L.marker(l.coords).addTo(map).bindPopup(popup);
    });
  </script>
</body></html>`;
}

export default function MapScreen() {
  const { data, isLoading } = useListings({ limit: 100 });

  const mapListings: MapListing[] = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((listing: Listing) => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      city: listing.city,
      imageUrl: listing.images[0]
        ? resolveImageUrl(listing.images[0].image_url)
        : null,
      coords: KZ_CITY_COORDS[listing.city] ?? null,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.notSupported}>
            Карта доступна только в веб-версии
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const html = buildLeafletHTML(mapListings);

  return (
    <View style={styles.container}>
      {React.createElement("iframe", {
        srcDoc: html,
        style: {
          width: "100%",
          height: "100%",
          border: "none",
        },
        sandbox: "allow-scripts allow-same-origin",
      })}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{mapListings.length} объявлений</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notSupported: { fontSize: 15, color: COLORS.muted, textAlign: "center" },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
});
