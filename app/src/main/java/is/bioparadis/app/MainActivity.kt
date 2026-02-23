package `is`.bioparadis.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import `is`.bioparadis.app.ui.screen.HomeScreen
import `is`.bioparadis.app.ui.theme.BioParadisTheme
import `is`.bioparadis.app.ui.viewmodel.HomeViewModel
import `is`.bioparadis.app.ui.viewmodel.HomeViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as BioParadisApp

        setContent {
            BioParadisTheme {
                val viewModel: HomeViewModel = viewModel(
                    factory = HomeViewModelFactory(app.repository)
                )
                HomeScreen(viewModel = viewModel)
            }
        }
    }
}
