package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `is`.bioparadis.app.data.model.TrackingStatus
import `is`.bioparadis.app.ui.theme.SeenGreen
import `is`.bioparadis.app.ui.theme.SkipRed
import `is`.bioparadis.app.ui.theme.WantGold

@Composable
fun TrackingButtons(
    currentStatus: TrackingStatus?,
    onToggle: (TrackingStatus) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        TrackingButton(
            symbol = "\u2605",
            isActive = currentStatus == TrackingStatus.WANT,
            activeBackground = WantGold.copy(alpha = 0.15f),
            activeBorder = WantGold.copy(alpha = 0.4f),
            activeColor = WantGold,
            onClick = { onToggle(TrackingStatus.WANT) },
        )
        TrackingButton(
            symbol = "\u2713",
            isActive = currentStatus == TrackingStatus.SEEN,
            activeBackground = SeenGreen.copy(alpha = 0.15f),
            activeBorder = SeenGreen.copy(alpha = 0.4f),
            activeColor = SeenGreen,
            onClick = { onToggle(TrackingStatus.SEEN) },
        )
        TrackingButton(
            symbol = "\u2715",
            isActive = currentStatus == TrackingStatus.SKIP,
            activeBackground = SkipRed.copy(alpha = 0.12f),
            activeBorder = SkipRed.copy(alpha = 0.3f),
            activeColor = SkipRed,
            onClick = { onToggle(TrackingStatus.SKIP) },
        )
    }
}

@Composable
private fun TrackingButton(
    symbol: String,
    isActive: Boolean,
    activeBackground: Color,
    activeBorder: Color,
    activeColor: Color,
    onClick: () -> Unit,
) {
    val bg = if (isActive) activeBackground else Color.White.copy(alpha = 0.04f)
    val borderColor = if (isActive) activeBorder else Color.White.copy(alpha = 0.07f)
    val textColor = if (isActive) activeColor else Color.White.copy(alpha = 0.35f)

    Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(bg)
            .border(1.dp, borderColor, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = symbol,
            fontSize = 14.sp,
            color = textColor,
        )
    }
}
