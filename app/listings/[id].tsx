import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useListing,
  useDeleteListing,
  useListingAvailability,
  useSimilarListings,
  ListingAvailability,
} from "@/hooks/use-listings";
import { useMyFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useCreateRentalRequest } from "@/hooks/use-rentals";
import { useOrCreateChat } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import { useCompareStore } from "@/store/compare.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import ListingCard from "@/components/ListingCard";
import { COLORS, resolveImageUrl } from "@/constants";
import CityMap from "@/components/CityMap";
import ReportModal from "@/components/ReportModal";
import TimePicker from "@/components/TimePicker";
import { saveRecentlyViewed } from "@/lib/recently-viewed";
import Toast from "react-native-toast-message";

const { width, height: screenHeight } = Dimensions.get("window");

const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const DAY_NAMES = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const CELL_SIZE = Math.floor((width - 48) / 7);

// ── date helpers ──────────────────────────────────────────────────────────

function toLocalDate(str: string): Date {
  const [y, m, d] = str.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.round(
    (toLocalDate(end).getTime() - toLocalDate(start).getTime()) / 86_400_000,
  ));
}

function formatDateRu(str: string): string {
  return toLocalDate(str).toLocaleDateString("ru-RU");
}

function isDateBooked(key: string, availability: ListingAvailability[]): boolean {
  const t = toLocalDate(key).getTime();
  return availability.some(
    (r) => t >= toLocalDate(r.start_date).getTime() && t <= toLocalDate(r.end_date).getTime(),
  );
}

function rangeHasBookedDates(start: string, end: string, availability: ListingAvailability[]): boolean {
  const a = toLocalDate(start).getTime();
  const b = toLocalDate(end).getTime();
  return availability.some(
    (r) => toLocalDate(r.start_date).getTime() <= b && toLocalDate(r.end_date).getTime() >= a,
  );
}

// ── CalendarPicker ────────────────────────────────────────────────────────

interface CalendarPickerProps {
  availability: ListingAvailability[];
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
}

function CalendarPicker({ availability, startDate, endDate, onRangeChange }: CalendarPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon = 0

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayPress = (day: number) => {
    const key = dateKey(calYear, calMonth, day);
    if (!startDate || (startDate && endDate)) {
      onRangeChange(key, "");
      return;
    }
    if (key < startDate) {
      onRangeChange(key, "");
      return;
    }
    if (rangeHasBookedDates(startDate, key, availability)) {
      Alert.alert("Недоступно", "В выбранном диапазоне есть занятые даты. Выберите другой период.");
      return;
    }
    onRangeChange(startDate, key);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  return (
    <View>
      <View style={calSt.header}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={calSt.monthTitle}>{MONTH_NAMES[calMonth]} {calYear}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={calSt.weekRow}>
        {DAY_NAMES.map((d) => (
          <Text key={d} style={calSt.weekDay}>{d}</Text>
        ))}
      </View>

      <View style={calSt.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={calSt.cell} />;
          const key = dateKey(calYear, calMonth, day);
          const dt = toLocalDate(key);
          const isPast = dt.getTime() < today.getTime();
          const booked = isDateBooked(key, availability);
          const isStart = key === startDate;
          const isEnd = key === endDate;
          const inRange = !!(startDate && endDate && key > startDate && key < endDate);
          const selected = isStart || isEnd;
          const disabled = isPast || booked;

          return (
            <TouchableOpacity
              key={key}
              style={[
                calSt.cell,
                inRange && calSt.cellInRange,
                selected && calSt.cellSelected,
                booked && calSt.cellBooked,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={[
                calSt.cellText,
                disabled && calSt.cellTextDisabled,
                selected && calSt.cellTextSelected,
              ]}>
                {day}
              </Text>
              {booked && <View style={calSt.bookedMark} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={calSt.legend}>
        <View style={calSt.legendItem}>
          <View style={[calSt.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={calSt.legendText}>Выбрано</Text>
        </View>
        <View style={calSt.legendItem}>
          <View style={[calSt.legendDot, { backgroundColor: "#dbeafe" }]} />
          <Text style={calSt.legendText}>Диапазон</Text>
        </View>
        <View style={calSt.legendItem}>
          <View style={[calSt.legendDot, { backgroundColor: "#fee2e2" }]} />
          <Text style={calSt.legendText}>Занято</Text>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { data: listing, isLoading } = useListing(id);
  const { data: favorites } = useMyFavorites();
  const { mutate: addFav } = useAddFavorite();
  const { mutate: removeFav } = useRemoveFavorite();
  const { mutate: createRental, isPending: isRenting } = useCreateRentalRequest();
  const { mutate: deleteListing } = useDeleteListing();
  const { mutate: openChat } = useOrCreateChat();
  const { user } = useAuthStore();
  const { data: availability = [], isLoading: isAvailabilityLoading } = useListingAvailability(id);
  const { data: similar = [] } = useSimilarListings(id, listing?.category_id ?? "");
  const { add: addCompare, remove: removeCompare, has: hasCompare, validate: validateCompare } =
    useCompareStore();

  const [rentalModal, setRentalModal] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace("/(tabs)")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track recently viewed for the home widget
  useEffect(() => {
    if (listing) {
      void saveRecentlyViewed(listing);
    }
  }, [listing]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [reportModal, setReportModal] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (!listing) return null;

  const isFav = favorites?.some((f) => f.listing_id === listing.id) ?? false;
  const isOwner = user?.id === listing.owner_id;

  const toggleFav = () => (isFav ? removeFav(listing.id) : addFav(listing.id));

  const useHourly = returnTime.length > 0;
  const endDatetime = endDate
    ? returnTime ? `${endDate}T${returnTime}:00` : endDate
    : "";
  const diffMs = startDate && endDatetime
    ? new Date(endDatetime).getTime() - new Date(startDate).getTime()
    : 0;
  const totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const hourlyRate = Number(listing.price) / 24;
  const rentalCost = useHourly
    ? Math.ceil(totalHours) * hourlyRate
    : days * Number(listing.price);
  const totalCost = rentalCost + Number(listing.deposit);

  const canSubmit = !!startDate && !!endDate && agreed;

  const closeModal = () => {
    setRentalModal(false);
    setStartDate("");
    setEndDate("");
    setReturnTime("");
    setAgreed(false);
  };

  const handleRent = () => {
    if (!startDate || !endDate || !agreed) return;
    createRental(
      { listing_id: listing.id, start_date: startDate, end_date: endDatetime },
      {
        onSuccess: () => {
          closeModal();
          Alert.alert("Успешно", "Заявка на аренду отправлена! Ожидайте подтверждения владельца.");
        },
        onError: (e: Error) => Alert.alert("Ошибка", e.message),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert("Удалить объявление?", "Это действие необратимо", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => deleteListing(listing.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleChat = () => {
    openChat(listing.owner_id, {
      onSuccess: (chat) => router.push(`/chats/${chat.id}`),
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {listing.images.length > 0 ? (
        <View>
          <FlatList
            data={listing.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) =>
              setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: resolveImageUrl(item.image_url) ?? "" }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          />
          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={60} color={COLORS.border} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <TouchableOpacity onPress={toggleFav}>
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={26}
              color={isFav ? COLORS.danger : COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{listing.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="grid-outline" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{listing.category.name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{listing.views_count}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{Number(listing.price).toLocaleString()} ₸/день</Text>
          <Text style={styles.deposit}>Залог: {Number(listing.deposit).toLocaleString()} ₸</Text>
        </View>

        <View style={styles.safeBadge}>
          <Ionicons name="shield-checkmark" size={15} color={COLORS.success} />
          <Text style={styles.safeBadgeText}>Безопасная аренда</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Занятые даты</Text>
        {isAvailabilityLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />
        ) : availability.length > 0 ? (
          <View style={styles.bookedList}>
            {availability.map((r, i) => (
              <View key={i} style={styles.bookedRange}>
                <Ionicons name="calendar" size={14} color={COLORS.danger} />
                <Text style={styles.bookedRangeText}>
                  {formatDateRu(r.start_date)} — {formatDateRu(r.end_date)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noBooked}>Нет забронированных дат</Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Местоположение</Text>
        <CityMap city={listing.city} />

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.ownerRow}
          onPress={() => router.push(`/profile/${listing.owner_id}`)}
        >
          <View style={styles.ownerInfo}>
            {listing.owner.avatar_url ? (
              <Image
                source={{ uri: resolveImageUrl(listing.owner.avatar_url) ?? "" }}
                style={styles.ownerAvatar}
              />
            ) : (
              <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
                <Text style={styles.ownerAvatarLetter}>
                  {listing.owner.name[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <View style={styles.ownerNameRow}>
                <Text style={styles.ownerName}>{listing.owner.name}</Text>
                {listing.owner.premium_until &&
                  new Date(listing.owner.premium_until).getTime() > Date.now() && (
                    <View style={styles.premiumChip}>
                      <Ionicons name="diamond" size={10} color="#fff" />
                      <Text style={styles.premiumChipText}>Premium</Text>
                    </View>
                  )}
              </View>
              {listing.owner.rating_avg && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>
                    {parseFloat(listing.owner.rating_avg).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
        </TouchableOpacity>

        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/listings/edit/${listing.id}`)}
            >
              <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              <Text style={styles.deleteBtnText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <Text style={styles.chatBtnText}>Написать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rentBtn} onPress={() => setRentalModal(true)}>
              <Text style={styles.rentBtnText}>Арендовать</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isOwner && (
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => setReportModal(true)}
            >
              <Ionicons name="flag-outline" size={14} color={COLORS.muted} />
              <Text style={styles.reportBtnText}>Пожаловаться</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.compareBtn,
                hasCompare(listing.id) && styles.compareBtnActive,
              ]}
              onPress={() => {
                if (hasCompare(listing.id)) {
                  removeCompare(listing.id);
                  return;
                }
                const err = validateCompare(listing);
                if (err) {
                  Toast.show({ type: "error", text1: err });
                  return;
                }
                addCompare(listing);
                Toast.show({ type: "success", text1: "Добавлено в сравнение" });
              }}
            >
              <Ionicons
                name="git-compare-outline"
                size={14}
                color={hasCompare(listing.id) ? COLORS.primary : COLORS.muted}
              />
              <Text
                style={[
                  styles.reportBtnText,
                  hasCompare(listing.id) && { color: COLORS.primary },
                ]}
              >
                {hasCompare(listing.id) ? "В сравнении" : "Сравнить"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>Похожие объявления</Text>
            <FlatList
              horizontal
              data={similar.filter((s) => s.id !== listing.id).slice(0, 10)}
              keyExtractor={(it) => it.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <View style={{ width: 200 }}>
                  <ListingCard listing={item} />
                </View>
              )}
            />
          </View>
        )}

        <ReportModal
          visible={reportModal}
          onClose={() => setReportModal(false)}
          type="LISTING"
          targetId={listing.id}
        />
      </View>

      {/* ── Rental Modal ── */}
      <Modal visible={rentalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: screenHeight * 0.88 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите даты аренды</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <CalendarPicker
                availability={availability}
                startDate={startDate}
                endDate={endDate}
                onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              />

              {startDate ? (
                <View style={styles.selectedDatesRow}>
                  <View style={styles.selectedDateChip}>
                    <Text style={styles.selectedDateLabel}>Начало</Text>
                    <Text style={styles.selectedDateValue}>{formatDateRu(startDate)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.muted} />
                  <View style={[styles.selectedDateChip, !endDate && styles.selectedDateChipEmpty]}>
                    <Text style={styles.selectedDateLabel}>Конец</Text>
                    <Text style={[styles.selectedDateValue, !endDate && { color: COLORS.muted }]}>
                      {endDate ? formatDateRu(endDate) : "не выбрано"}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.dateHint}>Нажмите на день начала аренды</Text>
              )}

              {startDate && endDate && (
                <TimePicker
                  value={returnTime}
                  onChange={setReturnTime}
                  onClear={() => setReturnTime("")}
                />
              )}

              {startDate && endDate && (
                <View style={styles.costCard}>
                  <Text style={styles.costTitle}>Расчёт стоимости</Text>
                  {useHourly ? (
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>
                        {Math.ceil(totalHours)} ч. × {Math.round(hourlyRate).toLocaleString()} ₸
                      </Text>
                      <Text style={styles.costValue}>{Math.round(rentalCost).toLocaleString()} ₸</Text>
                    </View>
                  ) : (
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>{days} дн. × {Number(listing.price).toLocaleString()} ₸</Text>
                      <Text style={styles.costValue}>{rentalCost.toLocaleString()} ₸</Text>
                    </View>
                  )}
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Залог (возвратный)</Text>
                    <Text style={styles.costValue}>{Number(listing.deposit).toLocaleString()} ₸</Text>
                  </View>
                  <View style={[styles.costRow, styles.costTotalRow]}>
                    <Text style={styles.costTotalLabel}>Итого</Text>
                    <Text style={styles.costTotalValue}>{Math.round(totalCost).toLocaleString()} ₸</Text>
                  </View>
                </View>
              )}

              <View style={styles.agreementBox}>
                <Text style={styles.agreementTitle}>Договор аренды</Text>
                <ScrollView style={styles.agreementScroll} nestedScrollEnabled scrollEnabled>
                  <Text style={styles.agreementText}>
                    {"1. Арендатор обязуется вернуть имущество в надлежащем состоянии.\n\n2. В случае повреждения или утери арендованного имущества арендатор несёт полную материальную ответственность.\n\n3. Залог удерживается до подтверждения возврата имущества владельцем.\n\n4. Срок аренды определяется выбранными датами. Продление допускается по согласованию с арендодателем.\n\n5. Арендатор не вправе передавать имущество третьим лицам без письменного согласия арендодателя.\n\n6. Платформа выступает посредником и не несёт ответственности за состояние имущества."}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAgreed((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Я прочитал(а) и принимаю условия договора</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancel} onPress={closeModal}>
                  <Text style={styles.modalCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirm, (!canSubmit || isRenting) && { opacity: 0.45 }]}
                  onPress={handleRent}
                  disabled={!canSubmit || isRenting}
                >
                  <Text style={styles.modalConfirmText}>
                    {isRenting ? "Отправка..." : "Отправить заявку"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const calSt = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  monthTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  weekDay: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
    paddingVertical: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cellText: { fontSize: 14, color: COLORS.text },
  cellTextDisabled: { color: "#d1d5db" },
  cellTextSelected: { color: COLORS.white, fontWeight: "700" },
  cellInRange: { backgroundColor: "#dbeafe" },
  cellSelected: { backgroundColor: COLORS.primary, borderRadius: CELL_SIZE / 2 },
  cellBooked: { backgroundColor: "#fee2e2" },
  bookedMark: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.danger,
  },
  legend: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
    justifyContent: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: COLORS.muted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  image: { width, height: 260 },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: -20,
    marginBottom: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: COLORS.white, width: 18 },
  content: { padding: 16 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 12,
    lineHeight: 26,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: COLORS.muted },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  price: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  deposit: { fontSize: 13, color: COLORS.muted },
  safeBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  safeBadgeText: { fontSize: 12, color: COLORS.success, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  bookedList: { gap: 8 },
  bookedRange: { flexDirection: "row", alignItems: "center", gap: 8 },
  bookedRangeText: { fontSize: 13, color: COLORS.textSecondary },
  noBooked: { fontSize: 13, color: COLORS.muted, fontStyle: "italic" },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  ownerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22 },
  ownerAvatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  ownerAvatarLetter: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  ownerName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  ownerNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  premiumChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#f59e0b",
  },
  premiumChipText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  ratingText: { fontSize: 12, color: COLORS.muted },
  actions: { flexDirection: "row", gap: 10, marginBottom: 24 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  chatBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  rentBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  rentBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  ownerActions: { flexDirection: "row", gap: 10, marginBottom: 24 },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontWeight: "600" },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  deleteBtnText: { color: COLORS.danger, fontWeight: "600" },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  reportBtnText: { fontSize: 13, color: COLORS.muted },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compareBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  similarSection: { marginBottom: 24, gap: 10 },
  similarTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  selectedDatesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },
  selectedDateChip: {
    flex: 1,
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  selectedDateChipEmpty: { backgroundColor: COLORS.background },
  selectedDateLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  selectedDateValue: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  dateHint: { fontSize: 13, color: COLORS.muted, textAlign: "center", marginTop: 12 },
  costCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 8,
  },
  costTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 2 },
  costRow: { flexDirection: "row", justifyContent: "space-between" },
  costLabel: { fontSize: 14, color: COLORS.textSecondary },
  costValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  costTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  costTotalLabel: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  costTotalValue: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  modalCancelText: { color: COLORS.muted, fontWeight: "600" },
  modalConfirm: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalConfirmText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  agreementBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  agreementTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    padding: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  agreementScroll: { maxHeight: 140, paddingHorizontal: 12, paddingVertical: 10 },
  agreementText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxLabel: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 18 },
});
