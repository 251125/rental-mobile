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
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCreateListing, useUploadImage } from "@/hooks/use-listings";
import { useCategories } from "@/hooks/use-listings";
import { COLORS } from "@/constants";
import Toast from "react-native-toast-message";
import CityPicker from "@/components/CityPicker";
import CategoryPicker from "@/components/CategoryPicker";

export default function CreateListingScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace("/(tabs)")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: categories } = useCategories();
  const { mutate: create, isPending } = useCreateListing();
  const { mutateAsync: uploadImage } = useUploadImage();
  const [isUploading, setIsUploading] = useState(false);

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

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Toast.show({ type: "error", text1: "Нет доступа к камере" });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (uri: string) =>
    setImages((prev) => prev.filter((i) => i !== uri));

  const handleCreate = async () => {
    if (!title || !price || !city || !categoryId) {
      Toast.show({ type: "error", text1: "Заполните все обязательные поля" });
      return;
    }

    let image_urls: string[] = [];
    if (images.length > 0) {
      setIsUploading(true);
      try {
        image_urls = await Promise.all(images.map((uri) => uploadImage(uri)));
      } catch {
        Toast.show({ type: "error", text1: "Ошибка загрузки фото" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    create(
      { title, description, price, deposit: deposit || "0", city, category_id: categoryId, image_urls },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Объявление создано!" });
          router.replace("/" as never);
        },
        onError: (err) => {
          Toast.show({ type: "error", text1: err.message ?? "Ошибка" });
        },
      },
    );
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
        <CityPicker value={city} onChange={setCity} />

        <Text style={styles.label}>Категория *</Text>
        <CategoryPicker
          categories={categories ?? []}
          value={categoryId}
          onChange={setCategoryId}
        />

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
        </View>
        {images.length < 5 && (
          <View style={styles.photoBtnsRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImages}>
              <Ionicons name="images-outline" size={18} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Добавить фото</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Сфотографировать</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (isPending || isUploading) && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={isPending || isUploading}
        >
          <Text style={styles.submitText}>
            {isUploading ? "Загружаем фото..." : isPending ? "Создаём..." : "Создать объявление"}
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
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textarea: { height: 100, paddingTop: 12 },
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
  photoBtnsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  photoBtnText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
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
