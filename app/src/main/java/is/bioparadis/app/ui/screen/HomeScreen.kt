package `is`.bioparadis.app.ui.screen

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import `is`.bioparadis.app.ui.component.DateChipRow
import `is`.bioparadis.app.ui.component.EmptyState
import `is`.bioparadis.app.ui.component.ScreeningDetailSheet
import `is`.bioparadis.app.ui.component.Timeline
import `is`.bioparadis.app.ui.theme.Background
import `is`.bioparadis.app.ui.theme.Dim
import `is`.bioparadis.app.ui.theme.JetBrainsMono
import `is`.bioparadis.app.ui.theme.NowRed
import `is`.bioparadis.app.ui.viewmodel.HomeViewModel
import `is`.bioparadis.app.util.CalendarIntentHelper

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        // Header
        HeaderBar()

        // Date chips
        if (state.days.isNotEmpty()) {
            DateChipRow(
                days = state.days,
                selectedIndex = state.selectedDateIndex,
                onSelect = viewModel::selectDate,
            )
        }

        // Timeline area
        Box(modifier = Modifier.weight(1f)) {
            when {
                state.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = NowRed,
                        strokeWidth = 2.dp,
                    )
                }

                state.error != null && state.days.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = state.error ?: "Unknown error",
                            color = Dim,
                            fontSize = 13.sp,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = viewModel::retry,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White.copy(alpha = 0.1f),
                            ),
                        ) {
                            Text("Retry", color = Color.White)
                        }
                    }
                }

                state.screenings.isEmpty() -> {
                    EmptyState()
                }

                else -> {
                    val selectedDay = state.days.getOrNull(state.selectedDateIndex)
                    Timeline(
                        screenings = state.screenings,
                        tracking = state.tracking,
                        selectedScreening = state.selectedScreening,
                        isToday = selectedDay?.sublabel == "Today",
                        onScreeningClick = viewModel::selectScreening,
                    )
                }
            }
        }

        // Detail panel
        AnimatedVisibility(
            visible = state.selectedScreening != null,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
        ) {
            state.selectedScreening?.let { screening ->
                val selectedDay = state.days.getOrNull(state.selectedDateIndex)

                ScreeningDetailSheet(
                    screening = screening,
                    allShowtimes = state.allShowtimesForSelected,
                    tracking = state.tracking[screening.movie.id],
                    currentDate = selectedDay?.date ?: screening.date,
                    onClose = viewModel::clearSelection,
                    onToggleTracking = { status ->
                        viewModel.toggleTracking(screening.movie.id, status)
                    },
                    onTicketsClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(screening.ticketUrl))
                        context.startActivity(intent)
                    },
                    onCalendarClick = {
                        val intent = CalendarIntentHelper.createIntent(screening)
                        context.startActivity(intent)
                    },
                    onShowtimeClick = { ticketUrl ->
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ticketUrl))
                        context.startActivity(intent)
                    },
                )
            }
        }

        // Footer
        Footer()
    }
}

@Composable
private fun HeaderBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Icon
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFFC24D2C), Color(0xFF8A2C6E)),
                    ),
                    RoundedCornerShape(8.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(text = "\uD83C\uDFAC", fontSize = 16.sp)
        }

        Spacer(modifier = Modifier.width(10.dp))

        Column {
            Text(
                text = "Bíó Paradís",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Color.White,
                letterSpacing = (-0.02).sp,
            )
            Text(
                text = "Hverfisgata 54",
                fontFamily = JetBrainsMono,
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.3f),
            )
        }
    }
}

@Composable
private fun Footer() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "tap a screening \u00B7 track what you've seen and what to skip",
            fontFamily = JetBrainsMono,
            fontSize = 9.sp,
            color = Color.White.copy(alpha = 0.18f),
        )
        Spacer(modifier = Modifier.height(3.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "\u2605 want",
                fontFamily = JetBrainsMono,
                fontSize = 9.sp,
                color = Color.White.copy(alpha = 0.18f),
            )
            Text(
                text = "\u2713 seen",
                fontFamily = JetBrainsMono,
                fontSize = 9.sp,
                color = Color.White.copy(alpha = 0.18f),
            )
            Text(
                text = "\u2715 skip",
                fontFamily = JetBrainsMono,
                fontSize = 9.sp,
                color = Color.White.copy(alpha = 0.18f),
            )
        }
    }
}
