#!/usr/bin/env python3
"""
Streamlit app entry point for the Timetable Generator.
This file is placed at the root to ensure proper module imports.
"""

import sys
import os

# Add the timetable generatorv2/src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, "timetable generatorv2", "src")
sys.path.insert(0, src_path)

# Now import and run the main app
try:
    from app_streamlit import *
    # The app_streamlit.py file will handle the rest
except ImportError as e:
    import streamlit as st
    st.error(f"Failed to import the timetable generator: {e}")
    st.info("Please ensure all dependencies are installed correctly.")
    st.code("pip install -r requirements.txt")
