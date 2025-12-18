Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"
  config.vm.box_check_update = false

  machines = {
    "devops" => "192.168.56.10",
    "app" => "192.168.56.11",
    "db" => "192.168.56.12",
    "monitoring" => "192.168.56.13"
  }

  machines.each do |name, ip|
    config.vm.define name do |vm|
      vm.vm.hostname = name
      vm.vm.network "private_network", ip: ip
      vm.vm.provider "virtualbox" do |vb|
        vb.memory = 2048
        vb.cpus = 2
      end
      vm.vm.provision "shell", inline: <<-SHELL
        apt update -y
        apt install -y python3 python3-pip
      SHELL
    end
  end
end
