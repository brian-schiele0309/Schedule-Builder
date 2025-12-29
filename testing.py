import tkinter as tk
from tkinter import ttk


def time_converter(time:str):
    time_of_day = time[-2:]
    for i in range(len(time)):
        if time[i] == ':':
            index = i
    hour = int(time[0:index])
    minute = int(time[index+1:index+3])
    minute /= 60
    time_of_day = time_of_day.upper()
    if time_of_day == 'PM':
        hour += 12
    final_time = hour + minute
    return final_time

def length_of_activity(time1,time2):
    start_time = time_converter(time1)
    end_time = time_converter(time2)
    length = end_time - start_time
    length *= 60
    return length


#def event_select():
def event_selection():
    event_select_root = tk.Tk()
    selected_event_type = tk.StringVar()
    event_select_values = ['Pre-Scheduled Event', 'Needs To Be Scheduled']
    event_select_lab = tk.Label(event_select_root, text="Type of event")
    event_select_lab.pack(pady=0)
    event_select_drop_down = ttk.Combobox(event_select_root,textvariable=selected_event_type,values=event_select_values )
    event_select_drop_down.pack(pady=0)

    confirm_btn = create_button(event_select_root,selected_event_type,event_select_drop_down)
    confirm_btn.pack(pady=5)
    event_select_root.mainloop()
    selection = selected_event_type.get()
    if selection == "Pre-Scheduled Event":
        pre_scheduled_root = tk.Tk()
    
        hour_var = tk.StringVar()
        min_var = tk.StringVar()

        start_label = tk.Label(pre_scheduled_root, text = "Start Time")
        hour_label = tk.Label(pre_scheduled_root, text= "hour")
        minute_label = tk.Label(pre_scheduled_root,text='minute')

        start_label.pack()
        hour_label.pack(side='left',padx=5,pady=5)
        minute_label.pack(side='left',padx=5,pady=5)

        hours = [f"{h:02d}" for h in range(24)]
        hour_cb = ttk.Combobox(pre_scheduled_root, textvariable=hour_var, values=hours, width=5, state="readonly")
        hour_cb.pack(side="left", padx=5)

        minutes = [f"{m:02d}" for m in range(60)]
        minute_cb = ttk.Combobox(pre_scheduled_root, textvariable=min_var, values=minutes, width=5, state="readonly")
        minute_cb.pack(side="left", padx=5)

        pre_scheduled_root.mainloop()

def confirmation_button(event_val:tk.StringVar,drop_down_event:ttk.Combobox):
        val = event_val.get()
        if not val:
            print("No selection")
            return
        print(f"Confirmed selection: {val}")
        drop_down_event.config(state="disabled")


def create_button(root:tk.Tk,event:tk.StringVar,menu:ttk.Combobox):
     return tk.Button(root,text="Confirm",command=lambda:confirmation_button(event,menu))

event_selection()



