import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useListing, useUpdateListing, useCategories } from "@/hooks/use-listings";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";
import Toast from "react-native-toast-message";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);
  const { data: categories } = useCategories();
  const { mutate: updateListing, isPending } = useUpdateListing();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      setPrice(String(listing.price));
      setDeposit(String(listing.deposit));
      setCity(listing.city);
      setCategoryId(listing.category_id);
    }
  }, [listing]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewImages((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5),
      );
    }
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("deposit", deposit);
    formData.append("city", city);
    formData.append("category_id", categoryId);

    newImages.forEach((uri, i) => {
      const filename = uri.split("/").pop() ?? `photo_${i}.jpg`;
      formData.append("images", {
        uri,
        name: filename,
        type: "image/jpeg",
      } as unknown as Blob);
    });

    updateListing(
      { id, data: formData },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Объявление обновлено" });
          router.back();
        },
        onError: (err) => {
          Toast.show({ type: "error", text1: err.message ?? "Ошибка" });
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (!listing) return null;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.label}>Заголовок</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Цена (₸/день)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Залог (₸)</Text>
        <TextInput style={styles.input} value={deposit} onChangeText={setDeposit} keyboardType="numeric" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Город</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Категория</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={[styles.catText, categoryId === cat.id && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Текущие фото</Text>
        <View style={styles.imagesGrid}>
          {listing.images.map((img) => (
            <Image
              key={img.id}
              source={{ uri: resolveImageUrl(img.image_url) ?? "" }}
              style={styles.img}
            />
          ))}
        </View>

        <Text style={styles.label}>Добавить новые фото</Text>
        <View style={styles.imagesGrid}>
          {newImages.map((uri) => (
            <View key={uri} style={styles.imgWrap}>
              <Image source={{ uri }} style={styles.img} />
              <TouchableOpacity
                style={styles.removeImg}
                onPress={() => setNewImages((p) => p.filter((i) => i !== uri))}
              >
                <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {newImages.length < 5 && (
            <TouchableOpacity style={styles.addImg} onPress={pickImages}>
              <Ionicons name="add" size={30} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isPending}
        >
          <Text style={styles.submitText}>{isPending ? "Сохраняем..." : "Сохранить"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 16 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textarea: { height: 100, paddingTop: 12 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginTop: 4,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.muted },
  catTextActive: { color: COLORS.white, fontWeight: "600" },
  imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  imgWrap: { position: "relative" },
  img: { width: 88, height: 88, borderRadius: 8 },
  removeImg: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  addImg: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 24,
  },
  submitText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
});
