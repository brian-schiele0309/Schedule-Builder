import tkinter as tk
from tkinter import ttk

def open_time_picker():
    # Only create a Toplevel window for time selection
    time_win = tk.Toplevel(root)
    time_win.title("Select Start Time")

    hour_var = tk.StringVar()
    min_var = tk.StringVar()

    tk.Label(time_win, text="Start Time").pack()

    time_frame = tk.Frame(time_win)
    time_frame.pack(pady=5)

    tk.Label(time_frame, text="Hour").pack(side="left", padx=5)
    tk.Label(time_frame, text="Minute").pack(side="left", padx=5)

    hours = [f"{h:02d}" for h in range(24)]
    hour_cb = ttk.Combobox(time_frame, textvariable=hour_var, values=hours, width=5, state="readonly")
    hour_cb.pack(side="left", padx=5)

    minutes = [f"{m:02d}" for m in range(60)]
    minute_cb = ttk.Combobox(time_frame, textvariable=min_var, values=minutes, width=5, state="readonly")
    minute_cb.pack(side="left", padx=5)

    def confirm_time():
        print(f"Confirmed time: {hour_var.get()}:{min_var.get()}")
        # Optionally lock the combobox
        hour_cb.config(state="disabled")
        minute_cb.config(state="disabled")

    tk.Button(time_win, text="Confirm", command=confirm_time).pack(pady=10)

def confirm_event():
    selection = selected_event_type.get()
    if not selection:
        print("No selection")
        return
    print(f"Confirmed event: {selection}")
    event_select_cb.config(state="disabled")
    confirm_btn.config(state="disabled")
    if selection == "Pre-Scheduled Event":
        open_time_picker()

root = tk.Tk()
root.title("Select Event Type")

selected_event_type = tk.StringVar()
event_values = ['Pre-Scheduled Event', 'Needs To Be Scheduled']

tk.Label(root, text="Type of event").pack(pady=5)
event_select_cb = ttk.Combobox(root, textvariable=selected_event_type, values=event_values, state="readonly")
event_select_cb.pack(pady=5)

confirm_btn = tk.Button(root, text="Confirm", command=confirm_event)
confirm_btn.pack(pady=10)

root.mainloop()
