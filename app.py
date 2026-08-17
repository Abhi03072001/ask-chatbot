import streamlit as st
from rag.query import get_answer

st.set_page_config(page_title="AI University Assistant")

st.title("🎓 AI University Assistant")

# Chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Show messages
for msg in st.session_state.messages:
    st.chat_message(msg["role"]).write(msg["content"])

# Input
user_input = st.chat_input("Ask something...")

if user_input:
    st.chat_message("user").write(user_input)
    st.session_state.messages.append({"role": "user", "content": user_input})

    response = get_answer(user_input)

    st.chat_message("assistant").write(response)
    st.session_state.messages.append({"role": "assistant", "content": response})