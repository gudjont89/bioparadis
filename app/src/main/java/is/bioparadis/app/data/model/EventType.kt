package `is`.bioparadis.app.data.model

enum class EventType(val emoji: String, val label: String) {
    PARTY("\uD83C\uDF89", "Partísýning"),
    BLACK_SUNDAY("\uD83D\uDDA4", "Svartir Sunnudagar"),
    MIDVIKU("\uD83D\uDCC5", "Miðvikudagsbíó"),
    BIOTEKID("\uD83C\uDF9E\uFE0F", "Bíótekið"),
    GERMAN_DAYS("\uD83C\uDDE9\uD83C\uDDEA", "German Film Days"),
    FRENCH_DAYS("\uD83C\uDDEB\uD83C\uDDF7", "French Film Days"),
}
