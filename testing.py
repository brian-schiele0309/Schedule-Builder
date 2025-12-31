import tkinter as tk
from tkinter import ttk


def time_converter(time:str):
    """
    Converts a time from form '9:45 PM' into a numerical value where 12.25 = 12:15, etc.
    """
    ##Isolate AM or PM
    time_of_day = time[-2:]
    ##Find hour digits
    for i in range(len(time)):
        if time[i] == ':':
            index = i
    hour = int(time[0:index])
    minute = int(time[index+1:index+3])
    ##get minutes into decimal proportion of hour
    minute /= 60
    time_of_day = time_of_day.upper()
    if time_of_day == 'PM': ##24 hour clock
        hour += 12
    final_time = hour + minute
    return final_time

def length_of_activity(time1,time2):
    """
    Takes two times and determines how long is between them
    """
    start_time = time_converter(time1)
    end_time = time_converter(time2)
    length = end_time - start_time
    length *= 60
    return length


#def event_select():
def event_selection():
    """
    Allows a user to pick an event, goal is to give them the choice of an already scheduled event (like a class) or an event that needs to be scheduled
    (like studying) with different paths for each using tkinter
    """
    ##root is needed to store different tkinter objects
    event_select_root = tk.Tk()
    ##variable to store selected value from dropdown box
    selected_event_type = tk.StringVar()
    event_select_values = ['Pre-Scheduled Event', 'Needs To Be Scheduled']
    ##label for dropdown box
    event_select_lab = tk.Label(event_select_root, text="Type of event")
    event_select_lab.pack(pady=0)
    ##dropdown box definier, 
    event_select_drop_down = ttk.Combobox(event_select_root,textvariable=selected_event_type,values=event_select_values )
    event_select_drop_down.pack(pady=0)


    ##creates a button that confirms selection of event type
    confirm_btn = create_button(event_select_root,selected_event_type,event_select_drop_down)
    confirm_btn.pack(pady=5)
    event_select_root.mainloop()
    ##Right nwo this does nothing it is all done in confirmation button, look into that I don;t think thats right
    selection = selected_event_type.get()
    if selection == "Pre-Scheduled Event":
        open_start_time_picker(event_select_root)

def confirmation_button(event_val, drop_down_event, root):
    val = event_val.get()
    if not val:
        print("No selection")
        return

    drop_down_event.config(state="disabled")

    if val == "Pre-Scheduled Event":
        open_start_time_picker(root)



def create_button(root:tk.Tk,event:tk.StringVar,menu:ttk.Combobox):
     """
     Creates a confirmation button, could mofigy so that the 'command' input takes a variety of functions
     """
     return tk.Button(root,text="Confirm",command=lambda:confirmation_button(event,menu,root))

def open_start_time_picker(root):
    # Only create a Toplevel window for time selection, Allows for multiple windows in one root
    time_win = tk.Toplevel(root)
    time_win.title("Select Start Time")

    ##sets variables to be stored in
    hour_var = tk.StringVar()
    min_var = tk.StringVar()
    tod_var = tk.StringVar()

    tk.Label(time_win, text="Start Time").pack()

    ##creates a frame that displays our new dropboxes
    time_frame = tk.Frame(time_win)
    time_frame.pack(pady=5)

    #hour selection
    tk.Label(time_frame, text="Hour").pack(side="top", padx=5)
    hours = [f"{h:02d}" for h in range(1,13)]
    hour_cb = ttk.Combobox(time_frame, textvariable=hour_var, values=hours, width=5, state="readonly")
    hour_cb.pack(side="top", padx=5)

    ##minute selection
    tk.Label(time_frame, text="Minute").pack(side="top", padx=5)
    minutes = [f"{m:02d}" for m in range(60)]
    minute_cb = ttk.Combobox(time_frame, textvariable=min_var, values=minutes, width=5, state="readonly")
    minute_cb.pack(side="top", padx=5)

    ##AM or PM
    tk.Label(time_frame,text="Time of Day").pack(side="top",padx=5)
    tods = ['AM','PM']
    tod_cb = ttk.Combobox(time_frame,textvariable=tod_var,values=tods,width=5,state="readonly")
    tod_cb.pack(side="top",pady=5)

    def confirm_time():
        print(f"Confirmed time: {hour_var.get()}:{min_var.get()} {tod_var.get()}")
        # Optionally lock the combobox
        hour_cb.config(state="disabled")
        minute_cb.config(state="disabled")
        tod_cb.config(state="disabled")

    tk.Button(time_win, text="Confirm", command=confirm_time).pack(pady=10)


event_selection()



