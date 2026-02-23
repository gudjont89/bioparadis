package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import `is`.bioparadis.app.data.model.Screening
import `is`.bioparadis.app.data.model.TrackingStatus
import `is`.bioparadis.app.ui.theme.BorderColor
import `is`.bioparadis.app.ui.theme.JetBrainsMono
import `is`.bioparadis.app.util.formatHHMM
import java.time.LocalDate

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ScreeningDetailSheet(
    screening: Screening,
    allShowtimes: List<Screening>,
    tracking: TrackingStatus?,
    currentDate: LocalDate,
    onClose: () -> Unit,
    onToggleTracking: (TrackingStatus) -> Unit,
    onTicketsClick: () -> Unit,
    onCalendarClick: () -> Unit,
    onShowtimeClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val endTime = screening.time.plusMinutes(screening.movie.runtime.toLong())
    val cardColor = Color(screening.movie.color)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xF50C0C12))
            .padding(16.dp),
    ) {
        // Close button
        Box(modifier = Modifier.fillMaxWidth()) {
            // Top row: poster + info
            Row(modifier = Modifier.fillMaxWidth()) {
                // Poster
                AsyncImage(
                    model = screening.movie.posterUrl,
                    contentDescription = screening.movie.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .width(44.dp)
                        .height(66.dp)
                        .clip(RoundedCornerShape(5.dp)),
                )

                Spacer(modifier = Modifier.width(14.dp))

                // Title + meta
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = screening.movie.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White,
                        modifier = Modifier.padding(end = 28.dp),
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${screening.time.formatHHMM()} – ${endTime.formatHHMM()} · ${screening.movie.runtime} min",
                        fontFamily = JetBrainsMono,
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.4f),
                    )

                    // Event pills
                    if (screening.events.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(5.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            for (event in screening.events) {
                                EventPill(emoji = event.emoji, label = event.label)
                            }
                        }
                    }
                }
            }

            // Close button (top-right)
            Text(
                text = "\u2715",
                fontSize = 18.sp,
                color = Color.White.copy(alpha = 0.3f),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .clickable(onClick = onClose)
                    .padding(4.dp),
            )
        }

        // Action buttons
        Spacer(modifier = Modifier.height(12.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            // Tickets button
            ActionButton(
                label = "Tickets",
                bgColor = cardColor,
                onClick = onTicketsClick,
            )

            // Calendar button
            ActionButton(
                label = "+ Cal",
                bgColor = Color.White.copy(alpha = 0.07f),
                borderColor = Color.White.copy(alpha = 0.1f),
                onClick = onCalendarClick,
            )

            // Separator
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .height(24.dp)
                    .background(Color.White.copy(alpha = 0.07f)),
            )

            // Tracking buttons
            TrackingButtons(
                currentStatus = tracking,
                onToggle = onToggleTracking,
            )
        }

        // All showtimes
        if (allShowtimes.size > 1) {
            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Spacer(modifier = Modifier.height(10.dp))
            AllShowtimesRow(
                allShowtimes = allShowtimes,
                currentScreening = screening,
                currentDate = currentDate,
                onShowtimeClick = onShowtimeClick,
            )
        }
    }
}

@Composable
private fun EventPill(emoji: String, label: String) {
    Row(
        modifier = Modifier
            .background(Color.White.copy(alpha = 0.06f), RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(text = emoji, fontSize = 12.sp)
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            color = Color.White.copy(alpha = 0.5f),
        )
    }
}

@Composable
private fun ActionButton(
    label: String,
    bgColor: Color,
    borderColor: Color? = null,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(6.dp)

    Row(
        modifier = Modifier
            .clip(shape)
            .background(bgColor)
            .then(
                if (borderColor != null) Modifier.border(1.dp, borderColor, shape)
                else Modifier
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )
    }
}
