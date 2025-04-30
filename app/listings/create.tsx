import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCreateListing } from "@/hooks/use-listings";
import { useCategories } from "@/hooks/use-listings";
import { COLORS } from "@/constants";
import Toast from "react-native-toast-message";

export default function CreateListingScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const { data: categories } = useCategories();
  const { mutate: create, isPending } = useCreateListing();

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        ...result.assets.map((a) => a.uri),
      ].slice(0, 5));
    }
  };

  const removeImage = (uri: string) =>
    setImages((prev) => prev.filter((i) => i !== uri));

  const handleCreate = () => {
    if (!title || !price || !city || !categoryId) {
      Toast.show({ type: "error", text1: "Заполните все обязательные поля" });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("deposit", deposit || "0");
    formData.append("city", city);
    formData.append("category_id", categoryId);

    images.forEach((uri, i) => {
      const filename = uri.split("/").pop() ?? `photo_${i}.jpg`;
      const type = "image/jpeg";
      formData.append("images", { uri, name: filename, type } as unknown as Blob);
    });

    create(formData, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: "Объявление создано!" });
        router.back();
      },
      onError: (err) => {
        Toast.show({ type: "error", text1: err.message ?? "Ошибка" });
      },
    });
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.label}>Заголовок *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Название объявления"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Подробное описание..."
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Цена в день (₸) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="1000"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Залог (₸)</Text>
        <TextInput
          style={styles.input}
          value={deposit}
          onChangeText={setDeposit}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Город *</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Алматы"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Категория *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text
                style={[styles.catText, categoryId === cat.id && styles.catTextActive]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Фотографии (до 5)</Text>
        <View style={styles.imagesGrid}>
          {images.map((uri) => (
            <View key={uri} style={styles.imgWrap}>
              <Image source={{ uri }} style={styles.img} />
              <TouchableOpacity
                style={styles.removeImg}
                onPress={() => removeImage(uri)}
              >
                <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImg} onPress={pickImages}>
              <Ionicons name="add" size={30} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={isPending}
        >
          <Text style={styles.submitText}>
            {isPending ? "Создаём..." : "Создать объявление"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 16 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 14,
  },
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
  cats: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.muted },
  catTextActive: { color: COLORS.white, fontWeight: "600" },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
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
