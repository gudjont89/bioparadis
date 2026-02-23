package `is`.bioparadis.app.ui.component

import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import `is`.bioparadis.app.ui.theme.NowRed
import kotlinx.coroutines.delay
import java.time.LocalTime

private const val HOUR_START = 13
private const val PX_PER_MIN = 2.8f

@Composable
fun NowIndicator(modifier: Modifier = Modifier) {
    val now = LocalTime.now()
    val initialMinutes = (now.hour * 60 + now.minute) - (HOUR_START * 60)
    var minuteOffset by remember { mutableFloatStateOf(initialMinutes.toFloat()) }

    // Update every minute
    LaunchedEffect(Unit) {
        while (true) {
            delay(60_000)
            val t = LocalTime.now()
            minuteOffset = ((t.hour * 60 + t.minute) - (HOUR_START * 60)).toFloat()
        }
    }

    val xDp = (minuteOffset * PX_PER_MIN).dp

    // Pulse animation
    val infiniteTransition = rememberInfiniteTransition(label = "nowPulse")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "glowAlpha",
    )

    Box(modifier = modifier.offset(x = xDp)) {
        // Red line
        Box(
            modifier = Modifier
                .width(2.dp)
                .fillMaxHeight()
                .background(NowRed),
        )
        // Pulsing dot
        Box(
            modifier = Modifier
                .offset(x = (-4).dp, y = (-3).dp)
                .size(10.dp)
                .drawBehind {
                    drawCircle(
                        color = Color(0xFFFF4444),
                        radius = size.minDimension / 2 + 4.dp.toPx(),
                        alpha = glowAlpha * 0.4f,
                    )
                }
                .background(NowRed, CircleShape),
        )
    }
}
