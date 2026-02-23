package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `is`.bioparadis.app.data.model.DaySchedule
import `is`.bioparadis.app.ui.theme.BorderActive
import `is`.bioparadis.app.ui.theme.BorderColor
import `is`.bioparadis.app.ui.theme.Dim
import `is`.bioparadis.app.ui.theme.Faint
import `is`.bioparadis.app.ui.theme.NowRed

@Composable
fun DateChipRow(
    days: List<DaySchedule>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyRow(
        modifier = modifier,
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        itemsIndexed(days) { index, day ->
            DateChip(
                day = day,
                isSelected = index == selectedIndex,
                onClick = { onSelect(index) },
            )
        }
    }
}

@Composable
private fun DateChip(
    day: DaySchedule,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(8.dp)
    val bgColor = if (isSelected) Color.White.copy(alpha = 0.09f) else Color.White.copy(alpha = 0.02f)
    val borderCol = if (isSelected) BorderActive else BorderColor

    Column(
        modifier = Modifier
            .clip(shape)
            .border(1.dp, borderCol, shape)
            .background(bgColor)
            .clickable(onClick = onClick)
            .padding(horizontal = 13.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = day.label,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else Dim,
        )

        if (day.sublabel != null) {
            Text(
                text = day.sublabel,
                fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold,
                color = NowRed,
                letterSpacing = 0.05.sp,
            )
        } else if (day.screenings.isEmpty()) {
            Box(
                modifier = Modifier
                    .padding(top = 1.dp)
                    .size(4.dp)
                    .background(Faint, CircleShape),
            )
        }
    }
}
