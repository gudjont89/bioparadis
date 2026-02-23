package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `is`.bioparadis.app.data.model.Screening
import `is`.bioparadis.app.ui.theme.BorderColor
import `is`.bioparadis.app.ui.theme.Faint
import `is`.bioparadis.app.ui.theme.JetBrainsMono
import `is`.bioparadis.app.util.formatHHMM
import java.time.LocalDate

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AllShowtimesRow(
    allShowtimes: List<Screening>,
    currentScreening: Screening,
    currentDate: LocalDate,
    onShowtimeClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (allShowtimes.size <= 1) return

    Column(modifier = modifier) {
        Text(
            text = "ALL SHOWTIMES",
            fontSize = 9.sp,
            fontFamily = JetBrainsMono,
            color = Color.White.copy(alpha = 0.25f),
            letterSpacing = 0.06.sp,
            modifier = Modifier.padding(bottom = 6.dp),
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(5.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            for (showtime in allShowtimes) {
                val isCurrent = showtime.uniqueId == currentScreening.uniqueId
                val isPast = showtime.date < currentDate

                ShowtimeChip(
                    showtime = showtime,
                    isCurrent = isCurrent,
                    isPast = isPast,
                    onClick = { onShowtimeClick(showtime.ticketUrl) },
                )
            }
        }
    }
}

@Composable
private fun ShowtimeChip(
    showtime: Screening,
    isCurrent: Boolean,
    isPast: Boolean,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(5.dp)
    val bg = when {
        isCurrent -> Color.White.copy(alpha = 0.1f)
        else -> Color.White.copy(alpha = 0.04f)
    }
    val borderCol = if (isCurrent) Color.White.copy(alpha = 0.2f) else BorderColor

    val dayOfWeek = when (showtime.date.dayOfWeek.value) {
        1 -> "Mon"; 2 -> "Tue"; 3 -> "Wed"; 4 -> "Thu"
        5 -> "Fri"; 6 -> "Sat"; 7 -> "Sun"; else -> ""
    }
    val label = "$dayOfWeek ${showtime.date.dayOfMonth}"

    Row(
        modifier = Modifier
            .graphicsLayer { alpha = if (isPast) 0.35f else 1f }
            .clip(shape)
            .background(bg)
            .border(1.dp, borderCol, shape)
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            fontSize = 10.sp,
            fontFamily = JetBrainsMono,
            fontWeight = FontWeight.SemiBold,
            color = if (isCurrent) Color.White else Color.White.copy(alpha = 0.65f),
        )
        Text(
            text = showtime.time.formatHHMM(),
            fontSize = 10.sp,
            fontFamily = JetBrainsMono,
            color = if (isCurrent) Color.White else Color.White.copy(alpha = 0.4f),
        )
        for (event in showtime.events) {
            Text(
                text = event.emoji,
                fontSize = 10.sp,
            )
        }
    }
}
