package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import `is`.bioparadis.app.data.model.Screening
import `is`.bioparadis.app.data.model.TrackingStatus
import `is`.bioparadis.app.ui.theme.JetBrainsMono
import `is`.bioparadis.app.ui.theme.WantGold
import `is`.bioparadis.app.util.formatHHMM

@Composable
fun MovieCard(
    screening: Screening,
    trackingStatus: TrackingStatus?,
    isSelected: Boolean,
    cardWidth: Dp,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val cardColor = Color(screening.movie.color)
    val isDampened = trackingStatus == TrackingStatus.SEEN || trackingStatus == TrackingStatus.SKIP
    val isWant = trackingStatus == TrackingStatus.WANT
    val shape = RoundedCornerShape(7.dp)

    Box(
        modifier = modifier
            .width(cardWidth)
            .height(60.dp)
            .graphicsLayer {
                alpha = if (isDampened) 0.25f else 1f
            }
            .clip(shape)
            .then(
                if (isWant) {
                    Modifier.drawBehind {
                        drawRoundRect(
                            color = WantGold.copy(alpha = 0.5f),
                            cornerRadius = CornerRadius(7.dp.toPx()),
                            style = Stroke(width = 2.dp.toPx()),
                        )
                    }
                } else Modifier
            )
            .then(
                if (isSelected) {
                    Modifier.drawBehind {
                        drawRoundRect(
                            color = Color.White,
                            cornerRadius = CornerRadius(7.dp.toPx()),
                            style = Stroke(width = 2.dp.toPx()),
                        )
                    }
                } else Modifier
            )
            .clickable(onClick = onClick),
    ) {
        Row {
            // Poster thumbnail
            AsyncImage(
                model = screening.movie.posterUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .width(42.dp)
                    .fillMaxHeight(),
            )

            // Info section
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                cardColor.copy(alpha = 0.93f),
                                cardColor.copy(alpha = 0.80f),
                            ),
                        ),
                    )
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(
                        text = screening.movie.title,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        letterSpacing = 0.01.sp,
                        lineHeight = 14.sp,
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = "${screening.time.formatHHMM()} · ${screening.movie.runtime}m",
                        fontSize = 9.5.sp,
                        fontFamily = JetBrainsMono,
                        fontWeight = FontWeight.Medium,
                        color = Color.White.copy(alpha = 0.65f),
                    )
                }

                // Event badges (top-right)
                if (screening.events.isNotEmpty()) {
                    Row(
                        modifier = Modifier.align(Alignment.TopEnd),
                        horizontalArrangement = Arrangement.spacedBy(1.dp),
                    ) {
                        for (event in screening.events) {
                            Text(
                                text = event.emoji,
                                fontSize = 11.sp,
                            )
                        }
                    }
                }
            }
        }
    }
}
