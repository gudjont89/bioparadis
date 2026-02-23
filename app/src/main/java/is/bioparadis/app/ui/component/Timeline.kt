package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `is`.bioparadis.app.data.model.Screening
import `is`.bioparadis.app.data.model.TrackingStatus
import `is`.bioparadis.app.ui.theme.JetBrainsMono
import `is`.bioparadis.app.ui.theme.SurfaceVariant
import `is`.bioparadis.app.util.toMinutesSinceMidnight
import java.time.LocalTime
import kotlin.math.max

private const val PX_PER_MIN = 2.8f
private const val HOUR_START = 13
private const val HOUR_END = 24
private val TOTAL_WIDTH = ((HOUR_END - HOUR_START) * 60 * PX_PER_MIN + 60).dp
private val CARD_HEIGHT = 60.dp
private val LANE_HEIGHT = 76.dp
private val LANE_GAP = 4.dp
private val MIN_CARD_WIDTH = 100.dp
private val PADDING_H = 20.dp

@Composable
fun Timeline(
    screenings: List<Screening>,
    tracking: Map<String, TrackingStatus>,
    selectedScreening: Screening?,
    isToday: Boolean,
    onScreeningClick: (Screening) -> Unit,
    modifier: Modifier = Modifier,
) {
    val scrollState = rememberScrollState()
    val density = LocalDensity.current

    // Auto-scroll
    LaunchedEffect(screenings, isToday) {
        if (screenings.isEmpty()) return@LaunchedEffect

        val targetPx = if (isToday) {
            val now = LocalTime.now()
            val minutesSinceStart = now.toMinutesSinceMidnight() - (HOUR_START * 60)
            with(density) { ((minutesSinceStart * PX_PER_MIN).dp - 120.dp).toPx() }
        } else {
            val firstScreening = screenings.minByOrNull { it.time }
            firstScreening?.let {
                val minutes = it.time.toMinutesSinceMidnight() - (HOUR_START * 60)
                with(density) { ((minutes * PX_PER_MIN).dp - 40.dp).toPx() }
            } ?: 0f
        }
        scrollState.animateScrollTo(targetPx.toInt().coerceAtLeast(0))
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState),
    ) {
        Box(
            modifier = Modifier
                .width(TOTAL_WIDTH)
                .padding(top = 26.dp, bottom = 6.dp),
        ) {
            // Grid lines
            for (hour in HOUR_START..HOUR_END) {
                val x = ((hour - HOUR_START) * 60 * PX_PER_MIN).dp + PADDING_H
                GridLine(x = x, label = "${hour.toString().padStart(2, '0')}:00")
            }

            // Lanes
            Column(
                modifier = Modifier.padding(horizontal = PADDING_H),
                verticalArrangement = Arrangement.spacedBy(LANE_GAP),
            ) {
                for (laneIndex in 0..2) {
                    LaneRow(
                        laneIndex = laneIndex,
                        screenings = screenings.filter { it.lane == laneIndex },
                        tracking = tracking,
                        selectedScreening = selectedScreening,
                        isFirstLane = laneIndex == 0,
                        isToday = isToday,
                        onScreeningClick = onScreeningClick,
                    )
                }
            }
        }
    }
}

@Composable
private fun GridLine(x: androidx.compose.ui.unit.Dp, label: String) {
    // Vertical line
    Box(
        modifier = Modifier
            .offset(x = x)
            .width(1.dp)
            .fillMaxHeight()
            .background(Color.White.copy(alpha = 0.05f)),
    )
    // Hour label
    Text(
        text = label,
        modifier = Modifier
            .offset(x = x - 20.dp, y = 5.dp)
            .width(40.dp),
        fontSize = 9.sp,
        fontFamily = JetBrainsMono,
        fontWeight = FontWeight.Medium,
        color = Color.White.copy(alpha = 0.22f),
        maxLines = 1,
    )
}

@Composable
private fun LaneRow(
    laneIndex: Int,
    screenings: List<Screening>,
    tracking: Map<String, TrackingStatus>,
    selectedScreening: Screening?,
    isFirstLane: Boolean,
    isToday: Boolean,
    onScreeningClick: (Screening) -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(LANE_HEIGHT)
            .then(
                if (laneIndex % 2 == 0) {
                    Modifier
                        .clip(RoundedCornerShape(5.dp))
                        .background(SurfaceVariant)
                } else Modifier
            ),
    ) {
        // Screening cards
        for (screening in screenings) {
            val minuteOffset = screening.time.toMinutesSinceMidnight() - (HOUR_START * 60)
            val xOffset = (minuteOffset * PX_PER_MIN).dp
            val cardWidth = max(
                (screening.movie.runtime * PX_PER_MIN).dp,
                MIN_CARD_WIDTH,
            )

            MovieCard(
                screening = screening,
                trackingStatus = tracking[screening.movie.id],
                isSelected = selectedScreening?.ticketUrl == screening.ticketUrl,
                cardWidth = cardWidth,
                onClick = { onScreeningClick(screening) },
                modifier = Modifier
                    .offset(x = xOffset, y = 8.dp),
            )
        }

        // Now indicator (only in first lane, only today)
        if (isFirstLane && isToday) {
            val now = LocalTime.now()
            val minutesSinceStart = now.toMinutesSinceMidnight() - (HOUR_START * 60)
            if (minutesSinceStart in 0..(HOUR_END - HOUR_START) * 60) {
                NowIndicator(
                    modifier = Modifier.offset(y = (-6).dp),
                )
            }
        }
    }
}
