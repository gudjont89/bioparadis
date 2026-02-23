package `is`.bioparadis.app.domain

object MovieColorAssigner {

    private val PALETTE = intArrayOf(
        0xFFC24D2C.toInt(),
        0xFF2C6E8A.toInt(),
        0xFF8A5E2C.toInt(),
        0xFF4A7C3F.toInt(),
        0xFF6B3FA0.toInt(),
        0xFFA03F5E.toInt(),
        0xFF2C8A6E.toInt(),
        0xFF5E6B3F.toInt(),
        0xFF8A2C6E.toInt(),
        0xFF3F6BA0.toInt(),
        0xFFA07C3F.toInt(),
        0xFF3FA07C.toInt(),
        0xFF7C3FA0.toInt(),
        0xFFA0503F.toInt(),
        0xFF3F5EA0.toInt(),
        0xFF6B8A2C.toInt(),
    )

    fun colorForMovie(movieId: String): Int {
        val index = movieId.hashCode().and(0x7FFFFFFF) % PALETTE.size
        return PALETTE[index]
    }
}
