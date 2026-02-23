package `is`.bioparadis.app.ui.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `is`.bioparadis.app.ui.theme.Dim
import `is`.bioparadis.app.ui.theme.Faint
import `is`.bioparadis.app.ui.theme.JetBrainsMono

@Composable
fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "\uD83D\uDCCB",
            fontSize = 28.sp,
        )
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = "No screenings scheduled",
            fontSize = 13.sp,
            color = Dim,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "schedule will appear when available",
            fontSize = 11.sp,
            fontFamily = JetBrainsMono,
            color = Faint,
        )
    }
}
