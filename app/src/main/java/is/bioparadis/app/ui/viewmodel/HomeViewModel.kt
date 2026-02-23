package `is`.bioparadis.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import `is`.bioparadis.app.data.model.DaySchedule
import `is`.bioparadis.app.data.model.Screening
import `is`.bioparadis.app.data.model.TrackingStatus
import `is`.bioparadis.app.data.repository.ScheduleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val days: List<DaySchedule> = emptyList(),
    val selectedDateIndex: Int = 0,
    val screenings: List<Screening> = emptyList(),
    val tracking: Map<String, TrackingStatus> = emptyMap(),
    val selectedScreening: Screening? = null,
    val allShowtimesForSelected: List<Screening> = emptyList(),
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
)

class HomeViewModel(
    private val repository: ScheduleRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadData()
        observeTracking()
    }

    private fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val result = repository.refresh()

            if (result.isFailure) {
                _uiState.update { state ->
                    if (state.days.isEmpty()) {
                        state.copy(
                            isLoading = false,
                            error = "Could not load schedule. Check your connection.",
                        )
                    } else {
                        state.copy(isLoading = false)
                    }
                }
            }

            // Observe days after refresh
            observeDays()
        }
    }

    private fun observeDays() {
        viewModelScope.launch {
            repository.observeDays().collect { days ->
                _uiState.update { state ->
                    state.copy(
                        days = days,
                        isLoading = false,
                    )
                }
                // Load screenings for the selected date
                loadScreeningsForSelectedDate()
            }
        }
    }

    private fun observeTracking() {
        viewModelScope.launch {
            repository.observeTracking().collect { tracking ->
                _uiState.update { it.copy(tracking = tracking) }
            }
        }
    }

    private fun loadScreeningsForSelectedDate() {
        val state = _uiState.value
        val day = state.days.getOrNull(state.selectedDateIndex) ?: return

        viewModelScope.launch {
            repository.observeScreeningsForDate(day.date).collect { screenings ->
                _uiState.update { it.copy(screenings = screenings) }
            }
        }
    }

    fun selectDate(index: Int) {
        _uiState.update {
            it.copy(
                selectedDateIndex = index,
                selectedScreening = null,
                screenings = emptyList(),
            )
        }
        loadScreeningsForSelectedDate()
    }

    fun selectScreening(screening: Screening) {
        viewModelScope.launch {
            val allShowtimes = repository.getAllScreeningsForMovie(screening.movie.id)
            _uiState.update {
                it.copy(
                    selectedScreening = screening,
                    allShowtimesForSelected = allShowtimes,
                )
            }
        }
    }

    fun clearSelection() {
        _uiState.update { it.copy(selectedScreening = null) }
    }

    fun toggleTracking(movieId: String, status: TrackingStatus) {
        viewModelScope.launch {
            val current = _uiState.value.tracking[movieId]
            repository.setTracking(movieId, if (current == status) null else status)
        }
    }

    fun retry() {
        loadData()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            repository.refresh()
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }
}

class HomeViewModelFactory(
    private val repository: ScheduleRepository,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return HomeViewModel(repository) as T
    }
}
